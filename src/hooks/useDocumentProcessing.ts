import { useCallback, useMemo, useState } from "react";
import client from "../api/client";
import type { components } from "../api/v1.d.ts";

type DocumentProcessStartResponse =
  components["schemas"]["DocumentProcessStartResponse"];

export type DocumentProcessAction =
  | "process"
  | "refresh"
  | "retry"
  | "reprocess";

function endpointForAction(action: DocumentProcessAction):
  | "/api/documents/{document_id}/process"
  | "/api/documents/{document_id}/process/retry"
  | "/api/documents/{document_id}/process/reprocess" {
  if (action === "retry") return "/api/documents/{document_id}/process/retry";
  if (action === "reprocess") {
    return "/api/documents/{document_id}/process/reprocess";
  }
  return "/api/documents/{document_id}/process";
}

function defaultErrorMessage(action: DocumentProcessAction): string {
  if (action === "retry") return "Unable to retry document processing.";
  if (action === "reprocess") return "Unable to reprocess this document.";
  if (action === "refresh") return "Unable to refresh document processing status.";
  return "Unable to start document processing.";
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim().length > 0) return error;
  if (!error || typeof error !== "object") return fallback;

  const detail = (error as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim().length > 0) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return null;

        const msg = (item as { msg?: unknown }).msg;
        if (typeof msg === "string" && msg.trim().length > 0) return msg;

        const nestedDetail = (item as { detail?: unknown }).detail;
        if (typeof nestedDetail === "string" && nestedDetail.trim().length > 0) {
          return nestedDetail;
        }

        return null;
      })
      .filter((msg): msg is string => !!msg);

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  const message = (error as { message?: unknown }).message;
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  return fallback;
}

function dedupe(values: string[], id: string): string[] {
  if (values.includes(id)) return values;
  return [...values, id];
}

function remove(values: string[], id: string): string[] {
  return values.filter((value) => value !== id);
}

export function isProcessingStatus(status: string | null | undefined): boolean {
  const normalized = (status ?? "").toLowerCase();
  return (
    normalized === "pending" ||
    normalized === "queued" ||
    normalized === "processing" ||
    normalized === "running" ||
    normalized === "in_progress" ||
    normalized === "in-progress"
  );
}

export function isCompletedStatus(status: string | null | undefined): boolean {
  const normalized = (status ?? "").toLowerCase();
  return normalized === "completed" || normalized === "success";
}

export function isFailedStatus(status: string | null | undefined): boolean {
  const normalized = (status ?? "").toLowerCase();
  return normalized === "failed" || normalized === "error";
}

export default function useDocumentProcessing() {
  const [statusByDocId, setStatusByDocId] = useState<
    Record<string, DocumentProcessStartResponse>
  >({});
  const [inFlightDocIds, setInFlightDocIds] = useState<string[]>([]);
  const [errorByDocId, setErrorByDocId] = useState<Record<string, string>>({});

  const runAction = useCallback(
    async (
      docId: string,
      action: DocumentProcessAction,
    ): Promise<DocumentProcessStartResponse | null> => {
      const endpoint = endpointForAction(action);
      setInFlightDocIds((prev) => dedupe(prev, docId));
      setErrorByDocId((prev) => {
        const next = { ...prev };
        delete next[docId];
        return next;
      });

      try {
        const { data, error } = await client.POST(endpoint, {
          params: { path: { document_id: docId } },
        } as never);

        if (error || !data) {
          const message = extractErrorMessage(
            error,
            defaultErrorMessage(action),
          );
          setErrorByDocId((prev) => ({ ...prev, [docId]: message }));
          return null;
        }

        setStatusByDocId((prev) => ({ ...prev, [docId]: data }));
        return data;
      } catch (err: unknown) {
        setErrorByDocId((prev) => ({
          ...prev,
          [docId]: extractErrorMessage(err, defaultErrorMessage(action)),
        }));
        return null;
      } finally {
        setInFlightDocIds((prev) => remove(prev, docId));
      }
    },
    [],
  );

  const isInFlight = useCallback(
    (docId: string): boolean => inFlightDocIds.includes(docId),
    [inFlightDocIds],
  );

  const clearError = useCallback((docId: string) => {
    setErrorByDocId((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
  }, []);

  return {
    statusByDocId,
    errorByDocId,
    inFlightDocIds,
    runAction,
    isInFlight,
    clearError,
    processDocument: useMemo(
      () => (docId: string) => runAction(docId, "process"),
      [runAction],
    ),
    refreshDocument: useMemo(
      () => (docId: string) => runAction(docId, "refresh"),
      [runAction],
    ),
    retryDocument: useMemo(
      () => (docId: string) => runAction(docId, "retry"),
      [runAction],
    ),
    reprocessDocument: useMemo(
      () => (docId: string) => runAction(docId, "reprocess"),
      [runAction],
    ),
  };
}
