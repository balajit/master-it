import { useEffect, useState } from "react";
import type { components } from "../api/v1.d.ts";
import {
  isCompletedStatus,
  isFailedStatus,
  isProcessingStatus,
} from "../hooks/useDocumentProcessing";

type DocumentProcessStartResponse =
  components["schemas"]["DocumentProcessStartResponse"];
type DocumentProcessStage = components["schemas"]["DocumentProcessStage"];
type DocumentBookProcess = components["schemas"]["DocumentBookProcess"];
type DocumentProcessRun = components["schemas"]["DocumentProcessRun"];

type ProcessRunView = {
  process_id: number;
  run_mode: string;
  status: string;
  retry_count: number;
  max_retries: number;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
  stages: DocumentProcessStage[];
};

interface DocumentProcessingModalProps {
  open: boolean;
  documentName: string;
  response: DocumentProcessStartResponse | null;
  error: string | null;
  isLoading: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onRetry: () => void;
  onReprocess: () => void;
}

function statusPillClass(status: string): string {
  if (isCompletedStatus(status)) {
    return "bg-green-50 text-green-700 ring-green-600/20";
  }
  if (isFailedStatus(status)) {
    return "bg-red-50 text-red-700 ring-red-600/20";
  }
  if (isProcessingStatus(status)) {
    return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }
  return "bg-gray-100 text-gray-700 ring-gray-600/20";
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function formatValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function compactPairs(
  response: DocumentProcessStartResponse,
): Array<{ label: string; value: string }> {
  return Object.entries(response)
    .filter(
      ([key]) =>
        key !== "book_pipeline" &&
        key !== "process_runs",
    )
    .map(([key, value]) => ({
      label: formatFieldLabel(key),
      value: formatValue(value),
    }));
}

function formatDateTime(value: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function stageKey(processId: number, stage: DocumentProcessStage, index: number): string {
  return `${processId}-${stage.stage}-${stage.created_at}-${index}`;
}

export default function DocumentProcessingModal({
  open,
  documentName,
  response,
  error,
  isLoading,
  onClose,
  onRefresh,
  onRetry,
  onReprocess,
}: DocumentProcessingModalProps) {
  const [openStages, setOpenStages] = useState<Record<string, boolean>>({});
  const [openRuns, setOpenRuns] = useState<Record<number, boolean>>({});
  const status = response?.status ?? "unknown";
  const canRetry = !!response?.can_retry && isFailedStatus(status);
  const canReprocess =
    !!response && (isCompletedStatus(status) || isFailedStatus(status));
  const bookPipeline: DocumentBookProcess | null = response?.book_pipeline ?? null;
  const processRuns: DocumentProcessRun[] = response?.process_runs ?? [];
  const metadata = response ? compactPairs(response) : [];
  const runs: ProcessRunView[] = processRuns.map((run) => ({
    process_id: run.process_id,
    run_mode: run.run_mode,
    status: run.status,
    retry_count: run.retry_count,
    max_retries: run.max_retries,
    error_message: run.error_message,
    created_at: run.created_at,
    updated_at: run.updated_at,
    stages: run.stages ?? [],
  }));

  useEffect(() => {
    if (!open) return undefined;
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const latestRunId = runs.length > 0 ? runs[runs.length - 1].process_id : null;
    const next: Record<number, boolean> = {};
    runs.forEach((run) => {
      next[run.process_id] = run.process_id === latestRunId;
    });
    setOpenRuns(next);
  }, [open, runs]);

  useEffect(() => {
    if (!open) return;
    let latestFailed: { processId: number; stageIndex: number } | null = null;
    for (let runIdx = runs.length - 1; runIdx >= 0; runIdx -= 1) {
      const run = runs[runIdx];
      for (let stageIdx = run.stages.length - 1; stageIdx >= 0; stageIdx -= 1) {
        if (isFailedStatus(run.stages[stageIdx].result)) {
          latestFailed = { processId: run.process_id, stageIndex: stageIdx };
          break;
        }
      }
      if (latestFailed) break;
    }

    const next: Record<string, boolean> = {};
    runs.forEach((run) => {
      run.stages.forEach((stage, index) => {
        const key = stageKey(run.process_id, stage, index);
        next[key] =
          latestFailed?.processId === run.process_id &&
          latestFailed.stageIndex === index;
      });
    });
    setOpenStages(next);
  }, [open, runs]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Document Processing
            </h3>
            <p className="mt-1 text-sm text-gray-500">{documentName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close processing modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusPillClass(status)}`}
            >
              {status.replace(/_/g, " ")}
            </span>
            {isLoading && <span className="text-xs text-gray-500">Updating...</span>}
            {runs.length > 0 && (
              <span className="text-xs text-gray-500">
                Process #{runs[runs.length - 1].process_id}
              </span>
            )}
          </div>
          {response?.message && (
            <p className="mt-2 text-xs text-gray-700">{response.message}</p>
          )}
          {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
        </div>

        <div className="mt-3 max-h-[45vh] space-y-3 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
          {!response && !error && (
            <p className="text-sm text-gray-500">
              No processing data yet. Start processing or refresh status.
            </p>
          )}

          {response && (
            <>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
                {metadata.map((item) => (
                  <div key={item.label} className="flex items-baseline gap-2 border-b border-gray-100 py-1">
                    <dt className="shrink-0 text-gray-500">{item.label}:</dt>
                    <dd className="min-w-0 break-all text-gray-900">{item.value}</dd>
                  </div>
                ))}
              </dl>

              {bookPipeline && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-700">Book Pipeline</h4>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-700">
                    <span className={`rounded-full px-2 py-0.5 ring-1 ring-inset ${statusPillClass(bookPipeline.status)}`}>
                      {bookPipeline.status}
                    </span>
                    <span>Retries {bookPipeline.retry_count}/{bookPipeline.max_retries}</span>
                    <span>{formatDateTime(bookPipeline.updated_at)}</span>
                  </div>
                  {bookPipeline.error_message && (
                    <p className="mt-1.5 text-xs text-red-700">{bookPipeline.error_message}</p>
                  )}
                </div>
              )}

              {runs.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-700">Process Runs</h4>
                  <ul className="mt-1.5 space-y-1.5">
                    {runs.map((run) => (
                      <li key={run.process_id} className="rounded-md border border-gray-200 bg-gray-50">
                        <details
                          open={openRuns[run.process_id] ?? false}
                          onToggle={(event) => {
                            const target = event.currentTarget as HTMLDetailsElement;
                            setOpenRuns((prev) => ({
                              ...prev,
                              [run.process_id]: target.open,
                            }));
                          }}
                        >
                          <summary className="cursor-pointer list-none px-2.5 py-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-medium text-gray-900">
                                #{run.process_id} {run.run_mode}
                              </p>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${statusPillClass(run.status)}`}>
                                {run.status}
                              </span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                              <span>Retries {run.retry_count}/{run.max_retries}</span>
                              <span>Updated {formatDateTime(run.updated_at)}</span>
                            </div>
                          </summary>

                          <div className="border-t border-gray-200 px-2.5 py-2">
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                              <span>Created {formatDateTime(run.created_at)}</span>
                              <span>Updated {formatDateTime(run.updated_at)}</span>
                            </div>
                            {run.error_message && (
                              <p className="mt-1 text-[11px] text-red-700">{run.error_message}</p>
                            )}
                            {run.stages.length > 0 && (
                              <ul className="mt-1.5 space-y-1">
                                {run.stages.map((stage, index) => {
                                  const key = stageKey(run.process_id, stage, index);
                                  return (
                                    <li
                                      key={key}
                                      className="rounded-md border border-gray-200 bg-white"
                                    >
                                      <details
                                        open={openStages[key] ?? false}
                                        onToggle={(event) => {
                                          const target =
                                            event.currentTarget as HTMLDetailsElement;
                                          setOpenStages((prev) => ({
                                            ...prev,
                                            [key]: target.open,
                                          }));
                                        }}
                                      >
                                        <summary className="cursor-pointer list-none px-2 py-1.5">
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-[11px] font-medium text-gray-900">
                                              {stage.stage}
                                            </p>
                                            <span
                                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${statusPillClass(stage.result)}`}
                                            >
                                              {stage.result}
                                            </span>
                                          </div>
                                          <p className="mt-0.5 text-[10px] text-gray-500">
                                            {formatDateTime(stage.created_at)}
                                          </p>
                                        </summary>
                                        <div className="border-t border-gray-200 px-2 py-1.5">
                                          {stage.output ? (
                                            <pre className="whitespace-pre-wrap break-words rounded-md bg-gray-50 p-1.5 text-[10px] text-gray-700">
                                              {stage.output}
                                            </pre>
                                          ) : (
                                            <p className="text-[10px] text-gray-500">
                                              No output
                                            </p>
                                          )}
                                        </div>
                                      </details>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        </details>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {response && (!canRetry || !canReprocess) && (
          <div className="mt-2 space-y-1 text-[11px] text-gray-600">
            {!canRetry && (
              <p>
                Retry is available only when status is failed and retries are
                still allowed.
              </p>
            )}
            {!canReprocess && (
              <p>
                Reprocess is available only after a completed or failed run.
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={onRetry}
            disabled={!canRetry || isLoading}
            className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={onReprocess}
            disabled={!canReprocess || isLoading}
            className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
          >
            Reprocess
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
