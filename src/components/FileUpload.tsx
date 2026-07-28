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
    return parsed.protocol === "https:";
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
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function reset() {
    setError(null);
    setSuccess(null);
  }

  async function uploadFile(file: File, label: string) {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    reset();
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const { error: err } = await client.POST(
        "/api/courses/{course_id}/documents",
        {
          params: { path: { course_id: courseId } },
          body: form as never,
        },
      );

      if (err) throw new Error("Upload failed");

      setSuccess(`Uploaded ${label} (${formatBytes(file.size)})`);
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
      setError("Only valid HTTPS URLs are allowed");
      return;
    }

    setError("URL import is currently disabled. Download and upload the file directly.");
  }

  return (
    <div className="flex flex-col gap-4">
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
          disabled={uploading}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
        >
          Choose File
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
          disabled={uploading}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleFetchUrl}
          disabled={uploading || !url.trim()}
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
          Uploading...
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
