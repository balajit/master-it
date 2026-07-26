import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import client from "../api/client";
import type { components } from "../api/v1.d.ts";
import Layout from "../components/Layout";

type Course = components["schemas"]["Course"];
type Document = components["schemas"]["Document"];
type CourseStudyPlanResponse = components["schemas"]["CourseStudyPlanResponse"];
type StudyPlanDetail = components["schemas"]["StudyPlanDetail"];
type StudyPlanLesson = components["schemas"]["StudyPlanLesson"];
type StudyPlanMilestone = components["schemas"]["StudyPlanMilestone"];
type StudyPlanCheckpoint = components["schemas"]["StudyPlanCheckpoint"];

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

const LESSON_TYPE_COLORS: Record<string, string> = {
  introduction: "bg-blue-50 text-blue-700 ring-blue-600/20",
  core: "bg-gray-100 text-gray-700 ring-gray-500/20",
  advanced: "bg-purple-50 text-purple-700 ring-purple-600/20",
  review: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

const CHECKPOINT_COLORS: Record<string, string> = {
  quiz: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  practice: "bg-teal-50 text-teal-700 ring-teal-600/20",
  project: "bg-orange-50 text-orange-700 ring-orange-600/20",
  self_test: "bg-gray-100 text-gray-600 ring-gray-500/20",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function LessonTypeIcon({ type }: { type: string }) {
  if (type === "introduction")
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
      </svg>
    );
  if (type === "advanced")
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM5.05 3.05a.75.75 0 0 1 1.06 0l1.062 1.06A.75.75 0 1 1 5.05 4.112L5.05 3.05Zm10.9 0a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 0 1-1.062-1.061l1.061-1.06ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-6.75 3a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Zm12 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM6.34 14.66a.75.75 0 0 1-.18 1.05l-.93.68a.75.75 0 1 1-.85-1.23l.93-.68a.75.75 0 0 1 1.03.18Zm7.32 0a.75.75 0 0 0 .18 1.05l.93.68a.75.75 0 1 0 .85-1.23l-.93-.68a.75.75 0 0 0-1.03.18ZM10 16a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 16Z" />
      </svg>
    );
  if (type === "review")
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.598a.75.75 0 0 0-.75.75v3.634a.75.75 0 0 0 1.5 0v-2.033l.312.311a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V3.27a.75.75 0 0 0-1.5 0V5.37l-.312-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h3.634a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
      </svg>
    );
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M3.25 4A2.25 2.25 0 0 0 1 6.25v7.5A2.25 2.25 0 0 0 3.25 16h7.5A2.25 2.25 0 0 0 13 13.75v-7.5A2.25 2.25 0 0 0 10.75 4h-7.5ZM19 4.75a.75.75 0 0 0-1.28-.53l-3 3a.75.75 0 0 0-.22.53v4.5c0 .199.079.39.22.53l3 3A.75.75 0 0 0 19 15.25v-10.5Z" />
    </svg>
  );
}

function MilestoneCard({
  milestone,
  lessons,
  checkpoints,
}: {
  milestone: StudyPlanMilestone;
  lessons: StudyPlanLesson[];
  checkpoints: StudyPlanCheckpoint[];
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
            {milestone.order}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              {milestone.title}
            </h4>
            {milestone.description && (
              <p className="text-xs text-gray-500">{milestone.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{milestone.lesson_count} lessons</span>
          <span>{formatMinutes(milestone.estimated_minutes)}</span>
        </div>
      </div>

      <div className="px-5 py-3">
        <ul className="flex flex-col gap-1.5">
          {lessons.map((lesson) => (
            <li
              key={lesson.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                <LessonTypeIcon type={lesson.lesson_type} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {lesson.title}
                </p>
                {lesson.description && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
                    {lesson.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${LESSON_TYPE_COLORS[lesson.lesson_type] ?? "bg-gray-100 text-gray-600 ring-gray-500/20"}`}
                >
                  {lesson.lesson_type}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${DIFFICULTY_COLORS[lesson.difficulty] ?? "bg-gray-100 text-gray-600 ring-gray-500/20"}`}
                >
                  {lesson.difficulty}
                </span>
                <span className="text-xs text-gray-400">
                  {formatMinutes(lesson.estimated_minutes)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {checkpoints.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-gray-400">
            Checkpoints
          </p>
          <div className="flex flex-wrap gap-2">
            {checkpoints.map((cp) => (
              <div
                key={cp.id}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 ring-inset ${CHECKPOINT_COLORS[cp.checkpoint_type] ?? "bg-gray-100 text-gray-600 ring-gray-500/20"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
                {cp.title}
                <span className="text-gray-400">
                  {formatMinutes(cp.estimated_minutes)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StudyPlanSection({ plan }: { plan: StudyPlanDetail }) {
  const lessonsByMilestone = new Map<string, StudyPlanLesson[]>();
  const orphanLessons: StudyPlanLesson[] = [];

  for (const lesson of plan.lessons) {
    if (lesson.milestone_id) {
      const list = lessonsByMilestone.get(lesson.milestone_id) ?? [];
      list.push(lesson);
      lessonsByMilestone.set(lesson.milestone_id, list);
    } else {
      orphanLessons.push(lesson);
    }
  }

  const sortedMilestones = [...plan.milestones].sort(
    (a, b) => a.order - b.order,
  );

  const checkpointsByMilestone = new Map<string, StudyPlanCheckpoint[]>();
  for (const cp of plan.checkpoints) {
    const list = checkpointsByMilestone.get(cp.milestone_id) ?? [];
    list.push(cp);
    checkpointsByMilestone.set(cp.milestone_id, list);
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {plan.title || "Untitled Study Plan"}
          </h3>
          {plan.description && (
            <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M3.25 4A2.25 2.25 0 0 0 1 6.25v7.5A2.25 2.25 0 0 0 3.25 16h7.5A2.25 2.25 0 0 0 13 13.75v-7.5A2.25 2.25 0 0 0 10.75 4h-7.5ZM19 4.75a.75.75 0 0 0-1.28-.53l-3 3a.75.75 0 0 0-.22.53v4.5c0 .199.079.39.22.53l3 3A.75.75 0 0 0 19 15.25v-10.5Z" />
            </svg>
            {plan.total_lessons} lessons
          </span>
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
            </svg>
            {formatMinutes(plan.total_estimated_minutes)}
          </span>
        </div>
      </div>

      {plan.lessons.length === 0 && (
        <p className="mt-4 text-sm text-gray-400">
          No lessons in this study plan yet.
        </p>
      )}

      {orphanLessons.length > 0 && (
        <div className="mt-4">
          <ul className="flex flex-col gap-1.5">
            {orphanLessons.map((lesson) => (
              <li
                key={lesson.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                  <LessonTypeIcon type={lesson.lesson_type} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {lesson.title}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${LESSON_TYPE_COLORS[lesson.lesson_type] ?? "bg-gray-100 text-gray-600 ring-gray-500/20"}`}
                >
                  {lesson.lesson_type}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sortedMilestones.length > 0 && (
        <div className="mt-5 flex flex-col gap-4">
          {sortedMilestones.map((ms) => (
            <MilestoneCard
              key={ms.id}
              milestone={ms}
              lessons={lessonsByMilestone.get(ms.id) ?? []}
              checkpoints={checkpointsByMilestone.get(ms.id) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);

  const [studyPlan, setStudyPlan] = useState<CourseStudyPlanResponse | null>(
    null,
  );
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: err } = await client.GET("/api/courses");
      if (cancelled) return;

      if (err) {
        setError("Failed to load courses");
        setLoading(false);
        return;
      }

      const found = data.find((c) => c.id === Number(id));
      if (!found) {
        setError("Course not found");
        setLoading(false);
        return;
      }

      setCourse(found);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!course) return;
    let cancelled = false;

    async function loadDocs() {
      setDocsLoading(true);
      const { data } = await client.GET(
        "/api/courses/{course_id}/documents",
        { params: { path: { course_id: course!.id } } },
      );
      if (!cancelled && data) setDocuments(data);
      setDocsLoading(false);
    }

    async function loadPlan() {
      setPlanLoading(true);
      const { data } = await client.GET(
        "/api/courses/{course_id}/study-plan",
        { params: { path: { course_id: course!.id } } },
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
              {!planLoading && (!studyPlan || studyPlan.study_plans.length === 0) && (
                <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mx-auto h-8 w-8 text-gray-300">
                    <path d="M3.25 4A2.25 2.25 0 0 0 1 6.25v7.5A2.25 2.25 0 0 0 3.25 16h7.5A2.25 2.25 0 0 0 13 13.75v-7.5A2.25 2.25 0 0 0 10.75 4h-7.5ZM19 4.75a.75.75 0 0 0-1.28-.53l-3 3a.75.75 0 0 0-.22.53v4.5c0 .199.079.39.22.53l3 3A.75.75 0 0 0 19 15.25v-10.5Z" />
                  </svg>
                  <p className="mt-3 text-sm text-gray-500">
                    No study plans generated yet.
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Study plans are created automatically when documents are
                    processed.
                  </p>
                </div>
              )}
              {!planLoading && studyPlan && studyPlan.study_plans.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="text-xs text-gray-400">
                    {studyPlan.documents_processed} document
                    {studyPlan.documents_processed !== 1 ? "s" : ""} processed
                  </div>
                  {studyPlan.study_plans.map((plan) => (
                    <StudyPlanSection key={plan.doc_id} plan={plan} />
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
