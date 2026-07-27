import { useState, useEffect, type ReactNode } from "react";
import { useParams, Link } from "react-router";
import { Button } from "../components/study/ui";
import SidebarGroup from "../components/study/SidebarGroup";
import ProgressCard from "../components/study/ProgressCard";
import InfoCard from "../components/study/InfoCard";
import LearningCard from "../components/study/LearningCard";
import LessonItem from "../components/study/LessonItem";
import PracticeCard from "../components/study/PracticeCard";
import GoalCard from "../components/study/GoalCard";
import { getStudyService } from "../services/getStudyService";
import type { StudyPageData } from "../services/study";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatMinutes(mins: number): string {
  if (mins < 60) return `~${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}

const STAR_ICON: ReactNode = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-amber-500">
    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="grid h-dvh grid-rows-[auto_1fr] bg-gray-50">
      {/* Top bar */}
      <header className="z-40 flex h-14 items-center border-b border-gray-200 bg-white px-4 sm:h-16 sm:px-6">
        <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
      </header>
      {/* Body */}
      <div className="flex min-h-0">
        {/* Sidebar skeleton */}
        <aside className="hidden w-72 flex-col border-r border-gray-200 bg-white lg:flex">
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
            <div className="mt-1.5 h-2.5 w-32 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="flex flex-col gap-2 p-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        </aside>
        {/* Main skeleton */}
        <main className="flex-1 overflow-y-auto lg:pl-72">
          <div className="mx-auto max-w-[1200px] flex flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="h-40 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-black/5" />
            <div className="h-24 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-black/5" />
            <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-black/5" />
          </div>
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Error state                                                        */
/* ------------------------------------------------------------------ */

function ErrorState({ message, courseId }: { message: string; courseId: string }) {
  return (
    <div className="grid h-dvh place-items-center bg-gray-50">
      <div className="mx-auto max-w-sm text-center">
        <p className="text-sm font-medium text-red-600">Failed to load study page</p>
        <p className="mt-1 text-xs text-gray-500">{message}</p>
        <Link
          to={`/courses/${courseId}`}
          className="mt-4 inline-block text-xs text-gray-500 underline"
        >
          Back to course
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function StudyPage() {
  const { id = "" } = useParams<{ id: string }>();

  const [data, setData] = useState<StudyPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");

  // ── Fetch study data ────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    getStudyService()
      .getStudyPage(id)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        // Initialise selected item: resume lesson → first item in first group.
        const resume = result.resumeLessonId;
        const firstItem = result.groups[0]?.items[0]?.id ?? null;
        setSelectedId(resume ?? firstItem);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ── Loading / error states ──────────────────────────────────────────
  if (loading) return <LoadingSkeleton />;
  if (error)   return <ErrorState message={error} courseId={id} />;
  if (!data)   return null;

  // ── Derived data ────────────────────────────────────────────────────
  const allItems = data.groups.flatMap((g) =>
    g.items.flatMap((item) => [item, ...(item.children ?? [])]),
  );

  const filteredGroups = sidebarSearch.trim()
    ? data.groups
        .map((g) => ({
          ...g,
          items: g.items.filter(
            (item) =>
              item.label.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
              item.children?.some((c) =>
                c.label.toLowerCase().includes(sidebarSearch.toLowerCase()),
              ),
          ),
        }))
        .filter((g) => g.items.length > 0)
    : data.groups;

  const selectedLabel    = allItems.find((i) => i.id === selectedId)?.label ?? "";
  const selectedMilestone =
    data.groups.find((g) => g.items.some((i) => i.id === selectedId))?.title ?? "";

  const content = selectedId ? (data.contentMap[selectedId] ?? null) : null;

  return (
    <div className="grid h-dvh grid-rows-[auto_1fr] bg-gray-50">
      {/* ── Top bar ── */}
      <header className="z-40 flex h-14 items-center border-b border-gray-200 bg-white px-4 sm:h-16 sm:px-6">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mr-3 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
          </svg>
        </button>
        <Link to={`/courses/${id}`} className="text-base font-bold tracking-tight text-gray-900 sm:text-lg">
          master-it
        </Link>
        <div className="ml-auto">
          <Button variant="ghost" size="sm">Exit</Button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex min-h-0">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-14 bottom-0 left-0 z-30 flex w-72 flex-col border-r border-gray-200 bg-white transition-all duration-200 lg:top-16 ${
            sidebarCollapsed
              ? "-translate-x-full"
              : sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-semibold text-gray-900">{data.courseTitle}</h2>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {data.lessonCount} lessons · {formatMinutes(data.totalMinutes)} total
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="ml-2 shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="shrink-0 border-b border-gray-100 px-3 py-2.5">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                placeholder="Search lessons..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-900"
              />
            </div>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {filteredGroups.map((group) => (
              <SidebarGroup
                key={group.title}
                title={group.title}
                items={group.items}
                selectedId={selectedId}
                onSelect={(itemId) => {
                  setSelectedId(itemId);
                  setSidebarOpen(false);
                }}
              />
            ))}
            {filteredGroups.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-gray-400">
                No lessons match your search.
              </p>
            )}
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main
          className={`min-h-0 flex-1 overflow-y-auto ${sidebarCollapsed ? "lg:pl-0" : "lg:pl-72"}`}
        >
          <div className="mx-auto max-w-[1200px] flex flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {sidebarCollapsed && (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="self-start rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                title="Expand sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
            )}

            <ProgressCard
              title={selectedLabel}
              breadcrumbSegments={[
                { label: data.courseTitle, to: `/courses/${id}` },
                { label: selectedMilestone },
                { label: selectedLabel },
              ]}
              items={data.progressItems}
              selectedId={selectedId}
              onSelect={setSelectedId}
              meta={[
                { label: "MOCK 50 mastery points", icon: STAR_ICON },
                { label: data.totalMinutes > 0 ? formatMinutes(data.totalMinutes) : "MOCK ~30 min" },
                { label: `${data.lessonCount} lessons` },
              ]}
            />

            {content?.info && (
              <InfoCard title={content.info.title}>
                {content.info.body}
              </InfoCard>
            )}

            {content?.learning && (
              <LearningCard
                title={content.learning.title}
                estimatedTime={content.learning.estimatedTime}
                learningContent={
                  <>
                    {content.learning.lessons.map((l) => (
                      <LessonItem
                        key={l.title}
                        title={l.title}
                        description={l.description}
                        state={l.state}
                        duration={l.duration}
                        content={l.content}
                        onClick={() => {}}
                      />
                    ))}
                  </>
                }
                practiceContent={
                  <>
                    {content.learning.practices.map((p) => (
                      <LessonItem
                        key={p.title}
                        title={p.title}
                        description={p.description}
                        state={p.state}
                        duration={p.duration}
                        content={p.content}
                        onClick={() => {}}
                      />
                    ))}
                    {content.learning.practices.length === 0 && (
                      <p className="text-xs text-gray-400">MOCK No practice activities yet.</p>
                    )}
                  </>
                }
              />
            )}

            {content?.goal && (
              <GoalCard
                title={content.goal.title}
                description={content.goal.description}
                actionLabel={content.goal.actionLabel}
              />
            )}

            {content?.practiceCards && content.practiceCards.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {content.practiceCards.map((pc) => (
                  <PracticeCard
                    key={pc.title}
                    title={pc.title}
                    description={pc.description}
                    progressLabel={pc.progressLabel}
                    badge={pc.badge}
                    status={pc.status}
                    actionLabel={pc.actionLabel}
                    disabled={pc.disabled}
                  />
                ))}
              </div>
            )}

            {/* Previous / Next nav */}
            <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const idx = allItems.findIndex((i) => i.id === selectedId);
                    if (idx > 0) setSelectedId(allItems[idx - 1].id);
                  }}
                  disabled={allItems.findIndex((i) => i.id === selectedId) <= 0}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                  </svg>
                  Previous lesson
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const idx = allItems.findIndex((i) => i.id === selectedId);
                    if (idx < allItems.length - 1) setSelectedId(allItems[idx + 1].id);
                  }}
                  disabled={
                    allItems.findIndex((i) => i.id === selectedId) >= allItems.length - 1
                  }
                >
                  Next lesson
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </Button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
