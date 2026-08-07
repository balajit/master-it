import { useState } from "react";
import { CapgoFilePicker } from "@capgo/capacitor-file-picker";
import client from "../api/client";

const ACCEPTED_TYPES = [
  "application/pdf",
  "text/markdown",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

function isAllowedType(mimeType: string): boolean {
  return ACCEPTED_TYPES.includes(mimeType);
}

function validateFile(file: File): string | null {
  if (file.size <= 0) return "File is empty";
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File exceeds ${formatBytes(MAX_FILE_SIZE_BYTES)} limit`;
  }
  if (!isAllowedType(file.type)) {
    return "Unsupported file type";
  }
  return null;
}

function isSafeUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({
  courseId,
  onUploaded,
}: {
  courseId: number;
  onUploaded?: () => void;
}) {
  const [uploadMode, setUploadMode] = useState<"full" | "sample">("full");
  const [url, setUrl] = useState("");
  const [sampleStartPage, setSampleStartPage] = useState("1");
  const [sampleEndPage, setSampleEndPage] = useState("");
  const [sampledFilename, setSampledFilename] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // URL-to-PDF preview state
  const [urlPdfPreview, setUrlPdfPreview] = useState<{
    blobUrl: string;
    tempId: string;
    filename: string;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);

  function reset() {
    setError(null);
    setSuccess(null);
  }

  function parsePageInput(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const num = Number(trimmed);
    if (!Number.isInteger(num) || num < 1) return null;
    return num;
  }

  async function uploadFile(file: File, label: string) {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    let startPage: number | null = null;
    let endPage: number | null = null;

    if (uploadMode === "sample") {
      startPage = parsePageInput(sampleStartPage);
      if (startPage == null) {
        setError("Sample start page must be a whole number of 1 or greater");
        return;
      }

      if (sampleEndPage.trim().length > 0) {
        endPage = parsePageInput(sampleEndPage);
        if (endPage == null) {
          setError("Sample end page must be a whole number of 1 or greater");
          return;
        }
        if (endPage < startPage) {
          setError("Sample end page must be greater than or equal to start page");
          return;
        }
      }
    }

    reset();
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      let err: unknown = null;
      if (uploadMode === "sample") {
        form.append("sample_start_page", String(startPage));
        if (endPage != null) {
          form.append("sample_end_page", String(endPage));
        }
        const trimmedSampledFilename = sampledFilename.trim();
        if (trimmedSampledFilename.length > 0) {
          form.append("sampled_filename", trimmedSampledFilename);
        }

        ({ error: err } = await client.POST(
          "/api/courses/{course_id}/documents/upload_sample",
          {
            params: { path: { course_id: courseId } },
            body: form as never,
          },
        ));
      } else {
        ({ error: err } = await client.POST(
          "/api/courses/{course_id}/documents",
          {
            params: { path: { course_id: courseId } },
            body: form as never,
          },
        ));
      }

      if (err) throw new Error("Upload failed");

      if (uploadMode === "sample") {
        const range = endPage != null ? `${startPage}-${endPage}` : String(startPage);
        setSuccess(`Uploaded sampled pages ${range} from ${label} (${formatBytes(file.size)})`);
      } else {
        setSuccess(`Uploaded ${label} (${formatBytes(file.size)})`);
      }
      onUploaded?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handlePickFile() {
    try {
      const result = await CapgoFilePicker.pickFiles({
        types: ACCEPTED_TYPES,
        limit: 1,
      });

      const picked = result.files[0];
      if (!picked) return;

      if (picked.blob) {
        if (!isAllowedType(picked.mimeType)) {
          setError("Unsupported file type");
          return;
        }
        const file = new File([picked.blob], picked.name, {
          type: picked.mimeType,
        });
        await uploadFile(file, picked.name);
        return;
      }

      if (!picked.path) {
        setError("File has no accessible path");
        return;
      }

      setError("Selected file could not be read. Please choose a different file.");
    } catch (e) {
      if (e instanceof Error && e.message.includes("cancelled")) return;
      setError(e instanceof Error ? e.message : "File pick failed");
    }
  }

  async function handleFetchUrl() {
    const trimmed = url.trim();
    if (!trimmed) return;

    reset();

    if (!isSafeUrl(trimmed)) {
      setError("Only valid HTTP or HTTPS URLs are allowed");
      return;
    }

    setUploading(true);

    try {
      const { response } = await client.POST(
        "/api/courses/{course_id}/documents/convert-url",
        {
          params: { path: { course_id: courseId } },
          body: { url: trimmed },
          parseAs: "stream",
        },
      );

      if (!response.ok) {
        if (response.status === 400) throw new Error("Invalid or unreachable URL");
        if (response.status === 404) throw new Error("Course not found");
        if (response.status === 408) throw new Error("Page load timed out");
        if (response.status === 503) throw new Error("URL-to-PDF service unavailable");
        throw new Error(`URL conversion failed (${response.status})`);
      }

      const tempId = response.headers.get("X-Temp-Id") ?? "";
      const filename = response.headers.get("X-Filename") ?? "preview.pdf";

      if (!tempId) throw new Error("Server did not return a preview ID");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      setUrlPdfPreview({ blobUrl, tempId, filename });
    } catch (e) {
      setError(e instanceof Error ? e.message : "URL conversion failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirmUrl() {
    if (!urlPdfPreview) return;

    reset();
    setConfirming(true);

    try {
      const { error: err, data } = await client.POST(
        "/api/courses/{course_id}/documents/confirm-url-pdf",
        {
          params: { path: { course_id: courseId } },
          body: { temp_id: urlPdfPreview.tempId },
        },
      );

      if (err || !data) throw new Error("Failed to confirm document");

      URL.revokeObjectURL(urlPdfPreview.blobUrl);
      setUrlPdfPreview(null);
      setUrl("");
      setSuccess(`Imported ${urlPdfPreview.filename}`);
      onUploaded?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Confirmation failed");
    } finally {
      setConfirming(false);
    }
  }

  function handleCancelUrl() {
    if (urlPdfPreview) {
      URL.revokeObjectURL(urlPdfPreview.blobUrl);
      setUrlPdfPreview(null);
    }
    reset();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setUploadMode("full")}
            disabled={uploading}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              uploadMode === "full"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Full Upload
          </button>
          <button
            type="button"
            onClick={() => setUploadMode("sample")}
            disabled={uploading}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              uploadMode === "sample"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sample Upload
          </button>
        </div>
      </div>

      {uploadMode === "sample" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
          <p className="text-[11px] font-medium text-amber-900">
            Upload sample creates a separate course document.
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-amber-900">Start page</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={sampleStartPage}
                onChange={(e) => setSampleStartPage(e.target.value)}
                disabled={uploading}
                className="rounded-md border border-amber-200 bg-white px-2 py-1 text-[11px] text-gray-900 focus:border-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-amber-900">End page (optional)</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={sampleEndPage}
                onChange={(e) => setSampleEndPage(e.target.value)}
                disabled={uploading}
                className="rounded-md border border-amber-200 bg-white px-2 py-1 text-[11px] text-gray-900 focus:border-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-1">
              <span className="text-[10px] font-medium text-amber-900">Sampled filename</span>
              <input
                type="text"
                value={sampledFilename}
                onChange={(e) => setSampledFilename(e.target.value)}
                disabled={uploading}
                placeholder="optional"
                className="rounded-md border border-amber-200 bg-white px-2 py-1 text-[11px] text-gray-900 placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              />
            </label>
          </div>
        </div>
      )}

      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 transition-colors ${
          uploading
            ? "border-gray-200 bg-gray-50"
            : "border-gray-300 bg-white hover:border-gray-400"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-8 w-8 text-gray-400"
        >
          <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
          <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
        </svg>
        <p className="text-sm text-gray-500">
          PDF, Markdown, TXT, or Word document
        </p>
        <p className="text-xs text-gray-400">
          Max file size: {formatBytes(MAX_FILE_SIZE_BYTES)}
        </p>
        <button
          type="button"
          onClick={handlePickFile}
          disabled={uploading || !!urlPdfPreview}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
        >
          {uploadMode === "sample" ? "Choose Source File" : "Choose File"}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-medium text-gray-400">or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="flex gap-2">
        <input
          type="url"
          placeholder="https://example.com/file.pdf"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleFetchUrl();
          }}
          disabled={uploading || !!urlPdfPreview}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleFetchUrl}
          disabled={uploading || !url.trim() || !!urlPdfPreview}
          className="shrink-0 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          Fetch
        </button>
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
            />
          </svg>
          {uploading ? "Converting URL to PDF…" : "Uploading..."}
        </div>
      )}

      {urlPdfPreview && (
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center justify-between">
            <p className="truncate text-xs font-medium text-gray-700">
              {urlPdfPreview.filename}
            </p>
            <button
              type="button"
              onClick={handleCancelUrl}
              disabled={confirming}
              className="ml-2 shrink-0 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
          <iframe
            src={urlPdfPreview.blobUrl}
            title="PDF preview"
            className="h-64 w-full rounded-lg border border-gray-200 bg-white"
          />
          <button
            type="button"
            onClick={handleConfirmUrl}
            disabled={confirming}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            {confirming ? "Importing…" : "Import Document"}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}
    </div>
  );
}
