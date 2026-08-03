import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import client from "../api/client";
import type { components } from "../api/v1.d.ts";
import Layout from "../components/Layout";
import DocumentProcessingModal from "../components/DocumentProcessingModal";
import useDocumentProcessing, {
  isCompletedStatus,
  isProcessingStatus,
} from "../hooks/useDocumentProcessing";

type Course = components["schemas"]["Course"];
type Document = components["schemas"]["Document"];
type CourseStudyPlanResponse = components["schemas"]["CourseStudyPlanResponse"];
type Chapter = components["schemas"]["Chapter"];
type Lesson = components["schemas"]["Lesson"];

const STATUS_COLORS: Record<Course["status"], string> = {
  OPEN: "bg-green-50 text-green-700 ring-green-600/20",
  CLOSED: "bg-red-50 text-red-700 ring-red-600/20",
  COMING_SOON: "bg-gray-100 text-gray-600 ring-gray-500/20",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-50 text-green-700 ring-green-600/20",
  intermediate: "bg-amber-50 text-amber-700 ring-amber-600/20",
  advanced: "bg-red-50 text-red-700 ring-red-600/20",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ChapterSection({ chapter }: { chapter: Chapter }) {
  const sortedLessons = [...(chapter.lessons ?? [])].sort((a, b) => a.order - b.order);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
            {chapter.order}
          </div>
          <h4 className="text-sm font-semibold text-gray-900">
            {chapter.title || "Untitled Chapter"}
          </h4>
        </div>
        <span className="text-xs text-gray-400">{sortedLessons.length} lesson{sortedLessons.length !== 1 ? "s" : ""}</span>
      </div>

      {sortedLessons.length === 0 && (
        <p className="px-5 py-3 text-sm text-gray-400">No lessons in this chapter yet.</p>
      )}

      {sortedLessons.length > 0 && (
        <div className="px-5 py-3">
          <ul className="flex flex-col gap-1.5">
            {sortedLessons.map((lesson: Lesson) => (
              <li
                key={lesson.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M3.25 4A2.25 2.25 0 0 0 1 6.25v7.5A2.25 2.25 0 0 0 3.25 16h7.5A2.25 2.25 0 0 0 13 13.75v-7.5A2.25 2.25 0 0 0 10.75 4h-7.5ZM19 4.75a.75.75 0 0 0-1.28-.53l-3 3a.75.75 0 0 0-.22.53v4.5c0 .199.079.39.22.53l3 3A.75.75 0 0 0 19 15.25v-10.5Z" />
                  </svg>
                </div>
                <p className="min-w-0 flex-1 text-sm font-medium text-gray-900">
                  {lesson.title || "Untitled Lesson"}
                </p>
                <span className="text-xs text-gray-400">p. {lesson.order}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const courseId = Number(id);
  const hasValidCourseId = Number.isFinite(courseId);

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(hasValidCourseId);
  const [error, setError] = useState<string | null>(null);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [processingDoc, setProcessingDoc] = useState<Document | null>(null);

  const {
    statusByDocId,
    errorByDocId,
    processDocument,
    refreshDocument,
    retryDocument,
    reprocessDocument,
    clearError,
    isInFlight,
  } = useDocumentProcessing();

  const [studyPlan, setStudyPlan] = useState<CourseStudyPlanResponse | null>(
    null,
  );
  const [planLoading, setPlanLoading] = useState(true);

  async function fetchDocumentsForCourse(targetCourseId: number) {
    setDocsLoading(true);
    const { data } = await client.GET("/api/courses/{course_id}/documents", {
      params: { path: { course_id: targetCourseId } },
    });
    if (data) setDocuments(data);
    setDocsLoading(false);
  }

  async function fetchStudyPlanForCourse(targetCourseId: number) {
    setPlanLoading(true);
    const { data } = await client.GET("/api/courses/{course_id}/study-plan", {
      params: { path: { course_id: targetCourseId } },
    });
    if (data) setStudyPlan(data);
    setPlanLoading(false);
  }

  useEffect(() => {
    if (!hasValidCourseId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: err } = await client.GET("/api/v1/courses/{course_id}", {
        params: { path: { course_id: courseId } },
      });
      if (cancelled) return;

      if (err || !data) {
        setError("Failed to load course");
        setLoading(false);
        return;
      }

      setCourse(data);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [courseId, hasValidCourseId]);

  useEffect(() => {
    if (!course) return;
    let cancelled = false;
    const courseId = course.id;

    async function loadDocs() {
      await fetchDocumentsForCourse(courseId);
      if (cancelled) return;
    }

    async function loadPlan() {
      await fetchStudyPlanForCourse(courseId);
      if (cancelled) return;
    }

    void loadDocs();
    void loadPlan();
    return () => {
      cancelled = true;
    };
  }, [course]);

  async function runProcessingAction(
    action: (docId: string) => Promise<
      components["schemas"]["DocumentProcessStartResponse"] | null
    >,
    docId?: string,
  ) {
    const targetDocId = docId ?? processingDoc?.id;
    if (!targetDocId) return;
    const response = await action(targetDocId);
    if (response && isCompletedStatus(response.status) && course) {
      await Promise.all([
        fetchDocumentsForCourse(course.id),
        fetchStudyPlanForCourse(course.id),
      ]);
    }
  }

  function openDocumentProcessing(doc: Document) {
    setProcessingDoc(doc);
    clearError(doc.id);
    void runProcessingAction(processDocument, doc.id);
  }

  useEffect(() => {
    if (!processingDoc) return;
    const status = statusByDocId[processingDoc.id]?.status;
    if (!isProcessingStatus(status)) return;

    const interval = window.setInterval(() => {
      void refreshDocument(processingDoc.id);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [processingDoc, refreshDocument, statusByDocId]);

  const processedDocumentIds = new Set((studyPlan?.documents ?? []).map((docNode) => docNode.document_id));

  return (
    <Layout>
      <div className="flex flex-col gap-8 py-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Content</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Course Details
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Back
          </button>
        </div>

        {loading && (
          <div className="flex flex-col gap-4">
            <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
          </div>
        )}

        {!hasValidCourseId && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            Invalid course id
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && course && (
          <>
            {/* Course Info */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-gray-900">
                    {course.title}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    {course.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_COLORS[course.status]}`}
                  >
                    {course.status.replace("_", " ")}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${DIFFICULTY_COLORS[course.difficulty.toLowerCase()] ?? "bg-gray-100 text-gray-600 ring-gray-500/20"}`}
                >
                  {course.difficulty}
                </span>
                <span>{course.number_of_credits} credits</span>
              </div>
              <div className="mt-4">
                <Link
                  to={`/courses/${course.id}/study`}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.344-5.891a1.5 1.5 0 0 0 0-2.538L6.3 2.841Z" />
                  </svg>
                  Start Studying
                </Link>
              </div>
            </div>

            {/* Documents */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
              <h3 className="text-base font-semibold text-gray-900">
                Documents
              </h3>
              {docsLoading && (
                <div className="mt-4 flex flex-col gap-2">
                  {[1, 2].map((n) => (
                    <div
                      key={n}
                      className="h-12 animate-pulse rounded-xl bg-gray-100"
                    />
                  ))}
                </div>
              )}
              {!docsLoading && documents.length === 0 && (
                <p className="mt-3 text-sm text-gray-400">
                  No documents attached to this course.
                </p>
              )}
              {!docsLoading && documents.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-2.5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path d="M3.25 4A2.25 2.25 0 0 0 1 6.25v7.5A2.25 2.25 0 0 0 3.25 16h7.5A2.25 2.25 0 0 0 13 13.75v-7.5A2.25 2.25 0 0 0 10.75 4h-7.5ZM19 4.75a.75.75 0 0 0-1.28-.53l-3 3a.75.75 0 0 0-.22.53v4.5c0 .199.079.39.22.53l3 3A.75.75 0 0 0 19 15.25v-10.5Z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {doc.filename}
                        </p>
                        <p className="text-xs text-gray-400">
                          {doc.content_type} &middot;{" "}
                          {formatBytes(doc.size_bytes)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openDocumentProcessing(doc)}
                        className={`relative shrink-0 rounded-full p-1 transition-colors hover:bg-amber-50 ${
                          isInFlight(doc.id) ||
                          isProcessingStatus(statusByDocId[doc.id]?.status)
                            ? "text-emerald-600"
                            : "text-gray-400 hover:text-amber-600"
                        }`}
                        title={
                          isInFlight(doc.id) ||
                          isProcessingStatus(statusByDocId[doc.id]?.status)
                            ? "View processing status"
                            : "Process document"
                        }
                        aria-label={
                          isInFlight(doc.id) ||
                          isProcessingStatus(statusByDocId[doc.id]?.status)
                            ? "View processing status"
                            : "Process document"
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 1a.75.75 0 0 1 .75.75v2.212l1.354-.781a.75.75 0 0 1 .75 1.299L10.5 5.76v1.49l2.354-1.358a.75.75 0 0 1 .75 1.299L11.25 8.5v1.25a.75.75 0 0 1-1.5 0V8.5l-2.354 1.358a.75.75 0 0 1-.75-1.299L8.75 7.25V5.76L6.396 7.118a.75.75 0 0 1-.75-1.299L7 5.962V3.75a.75.75 0 0 1 .75-.75H8.5v-.75A.75.75 0 0 1 9.25 1h.75Zm-.466 11.79a.75.75 0 0 1 .932 0l3.75 3a.75.75 0 0 1-.932 1.17L10 14.31l-3.534 2.65a.75.75 0 0 1-.932-1.17l3.75-3Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {(isInFlight(doc.id) ||
                          isProcessingStatus(statusByDocId[doc.id]?.status)) && (
                          <span className="absolute -right-1 -top-1 inline-flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          </span>
                        )}
                      </button>
                      {isInFlight(doc.id) || isProcessingStatus(statusByDocId[doc.id]?.status) ? null : processedDocumentIds.has(doc.id) ? (
                        <Link
                          to={`/triage?courseId=${course.id}`}
                          className="shrink-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-100"
                          title="Open triage for this course"
                        >
                          Triage
                        </Link>
                      ) : (
                        <span className="shrink-0 rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-1.5 text-[11px] font-medium text-gray-500">
                          Triage unavailable
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Study Plans */}
            <div>
              <h3 className="mb-4 text-base font-semibold text-gray-900">
                Study Plans
              </h3>
              {planLoading && (
                <div className="flex flex-col gap-4">
                  {[1, 2].map((n) => (
                    <div
                      key={n}
                      className="h-48 animate-pulse rounded-2xl bg-gray-100"
                    />
                  ))}
                </div>
              )}
              {!planLoading && (!studyPlan || (studyPlan.chapters ?? []).length === 0) && (
                <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mx-auto h-8 w-8 text-gray-300">
                    <path d="M3.25 4A2.25 2.25 0 0 0 1 6.25v7.5A2.25 2.25 0 0 0 3.25 16h7.5A2.25 2.25 0 0 0 13 13.75v-7.5A2.25 2.25 0 0 0 10.75 4h-7.5ZM19 4.75a.75.75 0 0 0-1.28-.53l-3 3a.75.75 0 0 0-.22.53v4.5c0 .199.079.39.22.53l3 3A.75.75 0 0 0 19 15.25v-10.5Z" />
                  </svg>
                  <p className="mt-3 text-sm text-gray-500">
                    No study plan generated yet.
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Study plans are created automatically when documents are
                    processed.
                  </p>
                </div>
              )}
              {!planLoading && studyPlan && (studyPlan.chapters ?? []).length > 0 && (
                <div className="flex flex-col gap-4">
                  {[...(studyPlan.chapters ?? [])].sort((a, b) => a.order - b.order).map((chapter) => (
                    <ChapterSection key={chapter.id} chapter={chapter} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <DocumentProcessingModal
        open={!!processingDoc}
        documentName={processingDoc?.filename ?? ""}
        response={
          processingDoc ? statusByDocId[processingDoc.id] ?? null : null
        }
        error={processingDoc ? errorByDocId[processingDoc.id] ?? null : null}
        isLoading={processingDoc ? isInFlight(processingDoc.id) : false}
        onClose={() => setProcessingDoc(null)}
        onRefresh={() => {
          void runProcessingAction(refreshDocument);
        }}
        onRetry={() => {
          void runProcessingAction(retryDocument);
        }}
        onReprocess={() => {
          void runProcessingAction(reprocessDocument);
        }}
      />
    </Layout>
  );
}
