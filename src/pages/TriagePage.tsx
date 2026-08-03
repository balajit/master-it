import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import client from "../api/client";
import type { components } from "../api/v1.d.ts";
import Layout from "../components/Layout";

type Course = components["schemas"]["Course"];
type Document = components["schemas"]["Document"];
type DiagnosisRunRead = components["schemas"]["DiagnosisRunRead"];
type DiagnosisFindingRead = components["schemas"]["DiagnosisFindingRead"];

export default function TriagePage() {
  const [params, setParams] = useSearchParams();
  const seededCourseId = params.get("courseId") ?? "";

  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [courseQuery, setCourseQuery] = useState("");

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(
    seededCourseId ? Number(seededCourseId) : null,
  );
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const [diagnosisByDocumentId, setDiagnosisByDocumentId] = useState<Record<string, DiagnosisRunRead>>({});
  const [findingsByDiagnosisId, setFindingsByDiagnosisId] = useState<Record<number, DiagnosisFindingRead[]>>({});
  const [runningDocumentId, setRunningDocumentId] = useState<string | null>(null);
  const [triageError, setTriageError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      setCoursesLoading(true);
      setCoursesError(null);
      const { data, error } = await client.GET("/api/courses");
      if (cancelled) return;
      if (error || !data) {
        setCoursesError("Failed to load courses");
      } else {
        setCourses(data);
      }
      setCoursesLoading(false);
    }

    void loadCourses();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCourseId || !Number.isFinite(selectedCourseId)) {
      setDocuments([]);
      return;
    }
    const courseId = selectedCourseId;

    let cancelled = false;
    async function loadDocuments() {
      setDocumentsLoading(true);
      const { data } = await client.GET("/api/courses/{course_id}/documents", {
        params: { path: { course_id: courseId } },
      });
      if (cancelled) return;
      setDocuments(data ?? []);
      setDocumentsLoading(false);
    }

    void loadDocuments();
    return () => {
      cancelled = true;
    };
  }, [selectedCourseId]);

  const selectedCourse = selectedCourseId
    ? courses.find((course) => course.id === selectedCourseId) ?? null
    : null;

  const filteredCourses = useMemo(() => {
    const query = courseQuery.trim().toLowerCase();
    if (!query) return courses;
    return courses.filter((course) =>
      course.title.toLowerCase().includes(query)
      || course.description.toLowerCase().includes(query),
    );
  }, [courseQuery, courses]);

  async function runTriage(documentId: string) {
    setRunningDocumentId(documentId);
    setTriageError(null);

    const { data, error } = await client.POST("/api/v1/triage/diagnoses", {
      body: { document_id: documentId },
    });

    if (error || !data) {
      setTriageError("Failed to run triage diagnosis");
      setRunningDocumentId(null);
      return;
    }

    setDiagnosisByDocumentId((prev) => ({ ...prev, [documentId]: data }));

    const { data: findingsData, error: findingsError } = await client.GET(
      "/api/v1/triage/diagnoses/{diagnosis_id}/findings",
      { params: { path: { diagnosis_id: data.diagnosis_id } } },
    );

    if (!findingsError && findingsData) {
      setFindingsByDiagnosisId((prev) => ({
        ...prev,
        [data.diagnosis_id]: findingsData,
      }));
    }

    setRunningDocumentId(null);
  }

  function selectCourse(courseId: number) {
    setSelectedCourseId(courseId);
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("courseId", String(courseId));
      return next;
    });
  }

  function isLikelyProcessed(documentId: string): boolean {
    const diagnosis = diagnosisByDocumentId[documentId];
    return diagnosis?.status === "completed" || diagnosis?.status === "running";
  }

  return (
    <Layout>
      <div className="flex flex-col gap-8 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Quality</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Triage
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Search a course, inspect its documents, and run triage diagnostics.
            </p>
            <div className="mt-3 inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
              <Link
                to="/courses/manage"
                className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-900"
              >
                Manage
              </Link>
              <Link
                to="/triage"
                className="rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white"
              >
                Triage
              </Link>
            </div>
          </div>
          <Link
            to="/courses/manage"
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Back to Courses
          </Link>
        </div>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="text"
                value={courseQuery}
                onChange={(event) => setCourseQuery(event.target.value)}
                placeholder="Search courses"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-1"
              />
            </div>

            <select
              value={selectedCourseId ?? ""}
              onChange={(event) => {
                const raw = event.target.value;
                if (!raw) {
                  setSelectedCourseId(null);
                  return;
                }
                selectCourse(Number(raw));
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-1"
            >
              <option value="">Select course</option>
              {filteredCourses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>

          {coursesLoading && <p className="mt-3 text-sm text-gray-400">Loading courses…</p>}
          {coursesError && <p className="mt-3 text-sm text-red-700">{coursesError}</p>}
        </section>

        {selectedCourse && (
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900">{selectedCourse.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{selectedCourse.description}</p>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-900">Documents</h3>
              {documentsLoading && (
                <p className="mt-3 text-sm text-gray-400">Loading documents…</p>
              )}
              {!documentsLoading && documents.length === 0 && (
                <p className="mt-3 text-sm text-gray-400">No documents available for this course.</p>
              )}

              {!documentsLoading && documents.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2">
                  {documents.map((document) => {
                    const diagnosis = diagnosisByDocumentId[document.id] ?? null;
                    const findings = diagnosis ? findingsByDiagnosisId[diagnosis.diagnosis_id] ?? [] : [];

                    return (
                      <li key={document.id} className="rounded-xl bg-gray-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{document.filename}</p>
                            <p className="text-xs text-gray-400">Document ID: {document.id}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              void runTriage(document.id);
                            }}
                            disabled={runningDocumentId === document.id}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
                          >
                            {runningDocumentId === document.id ? "Running…" : "Run Triage"}
                          </button>
                        </div>

                        {diagnosis && (
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5">
                              status: {diagnosis.status}
                            </span>
                            {diagnosis.verdict && (
                              <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5">
                                verdict: {diagnosis.verdict}
                              </span>
                            )}
                            <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5">
                              findings: {findings.length}
                            </span>
                          </div>
                        )}

                        {!diagnosis && isLikelyProcessed(document.id) && (
                          <p className="mt-2 text-xs text-emerald-700">Ready for triage.</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {triageError && (
                <p className="mt-3 text-sm text-red-700">{triageError}</p>
              )}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
