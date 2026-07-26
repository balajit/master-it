import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { hasPermission, hasRole } from "../context/auth-context";
import client from "../api/client";
import type { components } from "../api/v1.d.ts";
import AuthModal from "./auth/AuthModal";

type Course = components["schemas"]["Course"];

function parseCourseLine(line: string, id: number): Course | null {
  const parts = line.split("|");
  if (parts.length < 5) return null;
  const [title, description, credits, difficulty, status] = parts;
  return {
    id,
    title,
    description,
    number_of_credits: Number(credits),
    difficulty,
    status: status as Course["status"],
    created_at: "",
    updated_at: "",
  };
}

async function fetchMockCourses(): Promise<Course[]> {
  const res = await fetch("/resources/course_data.txt");
  if (!res.ok) return [];
  const text = await res.text();
  return text
    .split("\n")
    .filter((l) => l.trim())
    .map((line, i) => parseCourseLine(line, -(i + 1)))
    .filter((c): c is Course => c !== null);
}

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

export default function CourseCatalog({ onCourseAdded }: { onCourseAdded?: Course }) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const canDeleteCourse = hasPermission(user, "course:delete") || hasPermission(user, "*");
  const canEditCourse =
    hasPermission(user, "course:update") ||
    hasPermission(user, "*") ||
    hasRole(user, "Instructor") ||
    hasRole(user, "Administrator") ||
    hasRole(user, "SuperUser");
  const [authOpen, setAuthOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      setLoading(true);
      setError(null);

      if (!isAuthenticated) {
        const mock = await fetchMockCourses();
        if (!cancelled) {
          setCourses(mock);
          setLoading(false);
        }
        return;
      }

      const { data, error: err } = await client.GET("/api/courses");
      if (cancelled) return;

      if (err) {
        setError("Failed to load courses");
      } else if (data.length === 0) {
        setCourses(await fetchMockCourses());
      } else {
        setCourses(data);
      }
      setLoading(false);
    }

    loadCourses();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const coursesToShow =
    onCourseAdded && !courses.some((c) => c.id === onCourseAdded.id)
      ? [onCourseAdded, ...courses]
      : courses;

  function handleCourseClick(course: Course) {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }
    if (course.status !== "OPEN") return;
    navigate(`/courses/${course.id}/study`);
  }

  async function handleDeleteCourse() {
    if (!courseToDelete) return;
    setDeleting(true);
    const { error: err } = await client.DELETE("/api/courses/{course_id}", {
      params: { path: { course_id: courseToDelete.id } },
    });
    if (err) {
      setError("Failed to delete course");
    } else {
      setCourses((prev) => prev.filter((c) => c.id !== courseToDelete.id));
    }
    setCourseToDelete(null);
    setDeleting(false);
  }

  return (
    <>
      <section className="flex flex-col gap-4 py-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Explore Courses
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Browse our catalog and start learning today
          </p>
        </div>

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6"
              >
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="mt-3 h-3 w-full animate-pulse rounded bg-gray-100" />
                <div className="mt-1 h-3 w-2/3 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {!loading && !error && coursesToShow.length === 0 && (
          <p className="text-sm text-gray-500">No courses available yet.</p>
        )}

        {!loading && coursesToShow.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {coursesToShow.map((course) => {
              const isOpen = course.status === "OPEN";
              const difficultyKey = course.difficulty.toLowerCase();
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => handleCourseClick(course)}
                  className="relative flex flex-col rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md hover:ring-blue-200 active:scale-[0.99] disabled:cursor-default disabled:hover:shadow-sm disabled:hover:ring-black/5 sm:p-6"
                  disabled={!isOpen}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${STATUS_COLORS[course.status]}`}
                      >
                        {course.status.replace("_", " ")}
                      </span>
                      {isAuthenticated && canEditCourse && (
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
                      )}
                      {isAuthenticated && canDeleteCourse && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCourseToDelete(course);
                          }}
                          className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
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
                      )}
                    </div>
                  </div>

                  <p className="mt-2 line-clamp-2 flex-1 text-xs text-gray-500 sm:text-sm">
                    {course.description}
                  </p>

                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${DIFFICULTY_COLORS[difficultyKey] ?? "bg-gray-100 text-gray-600 ring-gray-500/20"}`}
                    >
                      {course.difficulty}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3.5 w-3.5 text-gray-400"
                      >
                        <path d="M10.75 10.818a.75.75 0 0 1 .75.75c0 .414-.336.75-.75.75a2.25 2.25 0 0 1-2.25-2.25.75.75 0 0 1 1.5 0c0 .69-.56 1.25-1.25 1.25a.75.75 0 0 1-.75-.75Z" />
                        <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM5.05 3.05a.75.75 0 0 1 1.06 0l1.062 1.06A.75.75 0 1 1 6.11 5.173L5.05 4.11a.75.75 0 0 1 0-1.06Zm9.9 0a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 0 1-1.062-1.061l1.061-1.06a.75.75 0 0 1 1.06 0ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-6.75 3a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Zm10.5 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM10 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-6.75 3a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Zm10.5 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Z" />
                      </svg>
                      {course.number_of_credits} credits
                    </span>
                  </div>

                  {isOpen && (
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                      Enroll now
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3.5 w-3.5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                  <Link
                    to={`/courses/${course.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900"
                  >
                    View details
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                      <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <AuthModal
        key={authOpen ? "open" : "closed"}
        open={authOpen}
        onClose={() => setAuthOpen(false)}
      />

      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Course
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete "{courseToDelete.title}"? This
              action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                disabled={deleting}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCourse}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
