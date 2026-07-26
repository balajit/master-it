import { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import client from "../api/client";
import type { components } from "../api/v1.d.ts";
import Layout from "../components/Layout";
import AddCourse from "../components/AddCourse";
import FileUpload from "../components/FileUpload";

type Course = components["schemas"]["Course"];
type Document = components["schemas"]["Document"];

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

export default function CourseManagementPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState<Course | null>(null);
  const [deletingId, setDeletingId] = useState(false);

  const [docsByCourse, setDocsByCourse] = useState<Record<number, Document[]>>(
    {},
  );
  const [docsLoading, setDocsLoading] = useState<number | null>(null);

  const [uploadCourse, setUploadCourse] = useState<Course | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<{
    courseId: number;
    docId: string;
    filename: string;
  } | null>(null);
  const [deletingDocId, setDeletingDocId] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const { data, error: err } = await client.GET("/api/courses");
      if (cancelled) return;
      if (err) {
        setError("Failed to load courses");
      } else {
        setCourses(data);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchDocs = useCallback(async (courseId: number) => {
    setDocsLoading(courseId);
    const { data, error: err } = await client.GET(
      "/api/courses/{course_id}/documents",
      { params: { path: { course_id: courseId } } },
    );
    if (!err) {
      setDocsByCourse((prev) => ({ ...prev, [courseId]: data }));
    }
    setDocsLoading(null);
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchDocs(selectedCourse.id);
    }
  }, [selectedCourse, fetchDocs]);

  function handleCourseAdded(course: Course) {
    setCourses((prev) => [course, ...prev]);
    setSelectedCourse(course);
  }

  function handleSelectCourse(course: Course) {
    setSelectedCourse((prev) => (prev?.id === course.id ? null : course));
  }

  async function handleDeleteCourse() {
    if (!deleting) return;
    setDeletingId(true);
    const { error: err } = await client.DELETE("/api/courses/{course_id}", {
      params: { path: { course_id: deleting.id } },
    });
    if (!err) {
      setCourses((prev) => prev.filter((c) => c.id !== deleting.id));
      if (selectedCourse?.id === deleting.id) setSelectedCourse(null);
    } else {
      setError("Failed to delete course");
    }
    setDeleting(null);
    setDeletingId(false);
  }

  async function handleDeleteDocument() {
    if (!deletingDoc) return;
    setDeletingDocId(true);
    const { error: err } = await client.DELETE("/api/documents/{document_id}", {
      params: { path: { document_id: deletingDoc.docId } },
    });
    if (!err) {
      setDocsByCourse((prev) => ({
        ...prev,
        [deletingDoc.courseId]: (prev[deletingDoc.courseId] ?? []).filter(
          (d) => d.id !== deletingDoc.docId,
        ),
      }));
    }
    setDeletingDoc(null);
    setDeletingDocId(false);
  }

  function handleUploadSuccess() {
    if (uploadCourse) {
      fetchDocs(uploadCourse.id);
    }
  }

  return (
    <Layout>
      <div className="flex flex-col gap-8 py-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Content</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Course Management
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Create courses and attach documents
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="shrink-0 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-800"
          >
            New Course
          </button>
        </div>

        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-20 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <p className="text-sm text-gray-500">
            No courses yet. Create your first course above.
          </p>
        )}

        {!loading && courses.length > 0 && (
          <div className="flex flex-col gap-3">
            {courses.map((course) => {
              const isSelected = selectedCourse?.id === course.id;
              const difficultyKey = course.difficulty.toLowerCase();
              const docs = docsByCourse[course.id] ?? [];
              const docsForThis = docsLoading === course.id;

              return (
                <div
                  key={course.id}
                  className={`rounded-2xl bg-white p-5 shadow-sm ring-1 transition-all sm:p-6 ${
                    isSelected
                      ? "ring-blue-300 ring-2 shadow-md"
                      : "ring-black/5 hover:shadow-md hover:ring-gray-200"
                  }`}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => handleSelectCourse(course)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/courses/${course.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-semibold text-gray-900 hover:underline sm:text-base"
                      >
                        {course.title}
                      </Link>
                      <div className="flex items-center gap-2">
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${STATUS_COLORS[course.status]}`}
                        >
                          {course.status.replace("_", " ")}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/courses/${course.id}/study`);
                          }}
                          className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600"
                          title="Study course"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-4 w-4"
                          >
                            <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.344-5.891a1.5 1.5 0 0 0 0-2.538L6.3 2.841Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/courses/${course.id}/edit`);
                          }}
                          className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          title="Edit course"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-4 w-4"
                          >
                            <path d="M2.695 14.763l-1.262 3.154a.75.75 0 0 1-1.06.233l-2.4-2.4a.75.75 0 0 1 .233-1.06l3.155-1.262a.75.75 0 0 1 .986.25l1.663 2.478a.75.75 0 0 0 1.023.144l2.13-1.065a.75.75 0 0 1 .986.25Z" />
                            <path d="M12.5 4.75a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V6.31l-5.47 5.47a.75.75 0 1 1-1.06-1.06l5.47-5.47H13.25a.75.75 0 0 1-.75-.75Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleting(course);
                          }}
                          className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Delete course"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-4 w-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs text-gray-500 sm:text-sm">
                      {course.description}
                    </p>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${DIFFICULTY_COLORS[difficultyKey] ?? "bg-gray-100 text-gray-600 ring-gray-500/20"}`}
                      >
                        {course.difficulty}
                      </span>
                      <span>{course.number_of_credits} credits</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-5 border-t border-gray-100 pt-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Documents
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadCourse(course);
                          }}
                          className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          title="Upload document"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-5 w-5"
                          >
                            <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
                            <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                          </svg>
                        </button>
                      </div>

                      {docsForThis && (
                        <p className="mt-3 text-xs text-gray-400">
                          Loading documents...
                        </p>
                      )}

                      {!docsForThis && docs.length === 0 && (
                        <p className="mt-3 text-xs text-gray-400">
                          No documents yet.
                        </p>
                      )}

                      {!docsForThis && docs.length > 0 && (
                        <ul className="mt-3 flex flex-col gap-1.5">
                          {docs.map((doc) => (
                            <li
                              key={doc.id}
                              className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-2.5"
                            >
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
                                onClick={() =>
                                  setDeletingDoc({
                                    courseId: course.id,
                                    docId: doc.id,
                                    filename: doc.filename,
                                  })
                                }
                                className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                title="Delete document"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="h-4 w-4"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddCourse
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={handleCourseAdded}
      />

      {uploadCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Upload Document
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  to &ldquo;{uploadCourse.title}&rdquo;
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploadCourse(null)}
                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
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
            <div className="mt-4">
              <FileUpload
                courseId={uploadCourse.id}
                onUploaded={handleUploadSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {deletingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Document
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete &ldquo;{deletingDoc.filename}
              &rdquo;? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                disabled={deletingDocId}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDocument}
                disabled={deletingDocId}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deletingDocId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Course
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete &ldquo;{deleting.title}&rdquo;?
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                disabled={deletingId}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCourse}
                disabled={deletingId}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
