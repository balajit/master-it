import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import client from "../api/client";
import type { components } from "../api/v1.d.ts";
import Layout from "../components/Layout";

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

  const [studyPlan, setStudyPlan] = useState<CourseStudyPlanResponse | null>(
    null,
  );
  const [planLoading, setPlanLoading] = useState(true);

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
      setDocsLoading(true);
      const { data } = await client.GET(
        "/api/courses/{course_id}/documents",
        { params: { path: { course_id: courseId } } },
      );
      if (!cancelled && data) setDocuments(data);
      setDocsLoading(false);
    }

    async function loadPlan() {
      setPlanLoading(true);
      const { data } = await client.GET(
        "/api/courses/{course_id}/study-plan",
        { params: { path: { course_id: courseId } } },
      );
      if (!cancelled && data) setStudyPlan(data);
      setPlanLoading(false);
    }

    loadDocs();
    loadPlan();
    return () => {
      cancelled = true;
    };
  }, [course]);

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
              {!planLoading && (!studyPlan || studyPlan.chapters.length === 0) && (
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
              {!planLoading && studyPlan && studyPlan.chapters.length > 0 && (
                <div className="flex flex-col gap-4">
                  {[...studyPlan.chapters].sort((a, b) => a.order - b.order).map((chapter) => (
                    <ChapterSection key={chapter.id} chapter={chapter} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
