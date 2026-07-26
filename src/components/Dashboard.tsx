import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { hasPermission } from "../context/auth-context";
import AddCourse from "./AddCourse";
import type { components } from "../api/v1.d.ts";

type ApiCourse = components["schemas"]["Course"];

interface Course {
  id: string;
  name: string;
  description: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lastAccessed: string;
}

const MOCK_COURSES: Course[] = [
  {
    id: "1",
    name: "Advanced TypeScript Patterns",
    description:
      "Master generics, conditional types, mapped types, and utility types for enterprise-grade applications.",
    progress: 72,
    totalLessons: 24,
    completedLessons: 17,
    lastAccessed: "2 hours ago",
  },
  {
    id: "2",
    name: "React Performance Optimization",
    description:
      "Deep dive into memoization, code splitting, virtualization, and profiling techniques.",
    progress: 35,
    totalLessons: 18,
    completedLessons: 6,
    lastAccessed: "Yesterday",
  },
  {
    id: "3",
    name: "Full-Stack API Design",
    description:
      "Build robust REST and GraphQL APIs with authentication, rate limiting, and documentation.",
    progress: 10,
    totalLessons: 30,
    completedLessons: 3,
    lastAccessed: "3 days ago",
  },
];

function ProgressRing({ progress }: { progress: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg className="h-11 w-11 shrink-0" viewBox="0 0 44 44">
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="4"
      />
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke="#2563eb"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 22 22)"
        className="transition-all duration-500"
      />
      <text
        x="22"
        y="22"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-gray-900 text-[10px] font-semibold"
      >
        {progress}%
      </text>
    </svg>
  );
}

export default function Dashboard({ onCourseAdded }: { onCourseAdded: (course: ApiCourse) => void }) {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const canCreateCourse = hasPermission(user, "course:create") || hasPermission(user, "*");

  function handleCourseAdded(course: ApiCourse) {
    onCourseAdded(course);
  }

  return (
    <div className="flex flex-col gap-8 py-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Dashboard</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Welcome back, {user?.name?.split(" ")[0]}!
          </h1>
        </div>
        {canCreateCourse && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 sm:text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M10.75 10.818a.75.75 0 0 1 .75.75c0 .414-.336.75-.75.75a2.25 2.25 0 0 1-2.25-2.25.75.75 0 0 1 1.5 0c0 .69-.56 1.25-1.25 1.25a.75.75 0 0 1-.75-.75Z" />
              <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM5.05 3.05a.75.75 0 0 1 1.06 0l1.062 1.06A.75.75 0 1 1 6.11 5.173L5.05 4.11a.75.75 0 0 1 0-1.06Zm9.9 0a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 0 1-1.062-1.061l1.061-1.06a.75.75 0 0 1 1.06 0ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-6.75 3a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Zm10.5 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM10 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-6.75 3a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Zm10.5 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Z" />
            </svg>
            Add course
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-900">My Courses</h2>

        {MOCK_COURSES.map((course) => {
          const isExpanded = expandedId === course.id;
          return (
            <div
              key={course.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md sm:p-6"
            >
              <div className="flex items-start gap-4">
                <ProgressRing progress={course.progress} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
                    {course.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Last accessed {course.lastAccessed}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : course.id)
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {isExpanded ? "Hide details" : "View details"}
                </button>

                <Link
                  to={`/courses/${course.id}/study`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.344-5.891a1.5 1.5 0 0 0 0-2.538L6.3 2.841Z" />
                  </svg>
                  Launch
                </Link>
              </div>

              {isExpanded && (
                <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm">
                  <p className="text-gray-600">{course.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                    <span>
                      <span className="font-medium text-gray-700">
                        {course.completedLessons}
                      </span>
                      /{course.totalLessons} lessons completed
                    </span>
                    <span>
                      <span className="font-medium text-gray-700">
                        {course.progress}%
                      </span>{" "}
                      complete
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AddCourse
        key={addOpen ? "open" : "closed"}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={handleCourseAdded}
      />
    </div>
  );
}
