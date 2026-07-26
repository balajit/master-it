import { useState, type ReactNode } from "react";
import { useParams, Link } from "react-router";
import { Button } from "../components/study/ui";
import SidebarGroup from "../components/study/SidebarGroup";
import ProgressCard from "../components/study/ProgressCard";
import InfoCard from "../components/study/InfoCard";
import LearningCard from "../components/study/LearningCard";
import LessonItem from "../components/study/LessonItem";
import PracticeCard from "../components/study/PracticeCard";
import GoalCard from "../components/study/GoalCard";
import type { LessonStatus } from "../components/study/statusConfig";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LessonItemDef {
  title: string;
  description?: string;
  state: "completed" | "in_progress" | "not_started";
  duration?: string;
  content?: ReactNode;
}

interface PracticeCardDef {
  title: string;
  description: string;
  progressLabel: string;
  badge: string;
  status: "not_started" | "in_progress" | "completed";
  actionLabel: string;
  disabled?: boolean;
}

interface ContentForItem {
  info: { title: string; body: string } | null;
  learning: {
    title: string;
    estimatedTime: string;
    lessons: LessonItemDef[];
    practices: LessonItemDef[];
  } | null;
  goal: { title: string; description: string; actionLabel: string } | null;
  practiceCards: PracticeCardDef[];
}

/* ------------------------------------------------------------------ */
/*  Placeholder data                                                   */
/* ------------------------------------------------------------------ */

const PLACEHOLDER_GROUPS = [
  {
    title: "Milestone 1 — Foundations",
    items: [
      {
        id: "lesson-1",
        label: "Introduction to the Course",
        status: "completed" as const,
        children: [
          { id: "lesson-1a", label: "Course overview", status: "completed" as const },
          { id: "lesson-1b", label: "Learning objectives", status: "completed" as const },
        ],
      },
      {
        id: "lesson-2",
        label: "Core Concepts",
        status: "in_progress" as const,
        children: [
          { id: "lesson-2a", label: "Key terminology", status: "completed" as const },
          { id: "lesson-2b", label: "Fundamental principles", status: "in_progress" as const },
        ],
      },
      { id: "checkpoint-1", label: "Knowledge Check", status: "not_started" as const, meta: "Quiz" },
    ],
  },
  {
    title: "Milestone 2 — Deep Dive",
    items: [
      { id: "lesson-3", label: "Advanced Patterns", status: "not_started" as const },
      { id: "lesson-4", label: "Real-World Applications", status: "not_started" as const },
    ],
  },
  {
    title: "Milestone 3 — Mastery",
    items: [
      { id: "lesson-5", label: "Best Practices", status: "not_started" as const },
      { id: "lesson-6", label: "Final Review", status: "not_started" as const },
      { id: "checkpoint-2", label: "Final Project", status: "not_started" as const, meta: "Project" },
    ],
  },
];

const PLACEHOLDER_STATUSES: Record<string, LessonStatus> = {
  "lesson-1": "mastered", "lesson-1a": "mastered", "lesson-1b": "mastered",
  "lesson-2": "practiced", "lesson-2a": "mastered", "lesson-2b": "practiced",
  "checkpoint-1": "familiar",
  "lesson-3": "attempted", "lesson-4": "not_started",
  "lesson-5": "not_started", "lesson-6": "not_started", "checkpoint-2": "not_started",
};

const STAR_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-amber-500">
    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
  </svg>
);

const CONTENT_MAP: Record<string, ContentForItem> = {
  "lesson-1": {
    info: {
      title: "About this unit",
      body: "This unit introduces the foundational concepts you'll need before moving on to more advanced topics. Take your time with the material and make sure you're comfortable with each idea before proceeding.",
    },
    learning: {
      title: "Lesson Content",
      estimatedTime: "~15 min",
      lessons: [
        { title: "Read the unit overview", description: "Understand the goals and scope of this lesson", state: "completed", duration: "5 min" },
        { title: "Watch the introductory video", description: "A 3-minute overview of core ideas", state: "completed", duration: "3 min" },
        { title: "Review the key vocabulary", state: "in_progress", duration: "7 min" },
      ],
      practices: [
        { title: "Complete the guided examples", state: "completed", duration: "8 min" },
        { title: "Try the ungraded practice quiz", description: "Test yourself before moving on", state: "not_started", duration: "5 min" },
      ],
    },
    goal: { title: "Great start!", description: "You've covered the fundamentals. Keep this momentum going into the deep dive.", actionLabel: "Start Deep Dive" },
    practiceCards: [],
  },

  "lesson-1a": {
    info: {
      title: "About this lesson",
      body: "Get a high-level view of the course structure, what you'll build, and how the milestones connect. This overview helps you plan your study schedule.",
    },
    learning: {
      title: "Lesson Content",
      estimatedTime: "~8 min",
      lessons: [
        { title: "Scan the course roadmap", description: "Visual map of all milestones and lessons", state: "completed", duration: "3 min" },
        { title: "Review the syllabus summary", state: "completed", duration: "5 min" },
      ],
      practices: [
        { title: "Identify your target completion date", state: "completed", duration: "2 min" },
      ],
    },
    goal: null,
    practiceCards: [],
  },

  "lesson-1b": {
    info: {
      title: "About this lesson",
      body: "Clear learning objectives help you focus on what matters. Each objective maps to a specific skill you'll demonstrate by the end of this milestone.",
    },
    learning: {
      title: "Lesson Content",
      estimatedTime: "~6 min",
      lessons: [
        { title: "Read the learning objectives", description: "Five key outcomes for this course", state: "completed", duration: "3 min" },
        { title: "Self-assess your starting point", state: "completed", duration: "3 min" },
      ],
      practices: [],
    },
    goal: null,
    practiceCards: [],
  },

  "lesson-2": {
    info: {
      title: "About this unit",
      body: "Core concepts form the backbone of this course. Master these building blocks and everything else will click into place.",
    },
    learning: {
      title: "Lesson Content",
      estimatedTime: "~25 min",
      lessons: [
        {
          title: "Study the core definitions",
          description: "Essential terms you'll use throughout",
          state: "completed",
          duration: "8 min",
          content: (
            <>
              <p className="text-sm leading-relaxed text-gray-700">
                Chemical reactions involve the transformation of one set of chemicals into another.
                Reactants are the starting materials, and products are the substances formed after
                the reaction completes. The law of conservation of mass tells us that atoms are
                neither created nor destroyed — they are simply rearranged into new configurations.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                Balancing equations ensures the same number of atoms of each element appear on both
                sides. A coefficient placed before a formula multiplies all atoms in that compound.
                For example, placing a 2 before H<sub>2</sub>O means two water molecules, giving
                four hydrogen atoms and two oxygen atoms total.
              </p>
            </>
          ),
        },
        {
          title: "Work through the syntax guide",
          description: "Hands-on walkthrough of basic syntax",
          state: "in_progress",
          duration: "10 min",
          content: (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-3 py-2">Reaction</th>
                    <th className="px-3 py-2">Balanced Equation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-3 py-2 text-gray-700">Combustion of methane</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-600">CH<sub>4</sub> + 2O<sub>2</sub> &rarr; CO<sub>2</sub> + 2H<sub>2</sub>O</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-gray-700">Synthesis of water</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-600">2H<sub>2</sub> + O<sub>2</sub> &rarr; 2H<sub>2</sub>O</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-gray-700">Rust formation</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-600">4Fe + 3O<sub>2</sub> &rarr; 2Fe<sub>2</sub>O<sub>3</sub></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-gray-700">Photosynthesis</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-600">6CO<sub>2</sub> + 6H<sub>2</sub>O &rarr; C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> + 6O<sub>2</sub></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-gray-700">Acid-base neutralization</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-600">HCl + NaOH &rarr; NaCl + H<sub>2</sub>O</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-gray-700">Decomposition of calcium carbonate</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-600">CaCO<sub>3</sub> &rarr; CaO + CO<sub>2</sub></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ),
        },
        { title: "Follow the interactive tutorial", state: "not_started", duration: "7 min" },
      ],
      practices: [
        { title: "Complete the syntax exercises", state: "in_progress", duration: "10 min" },
        { title: "Build a simple example from scratch", state: "not_started", duration: "15 min" },
      ],
    },
    goal: { title: "Keep going!", description: "You're building a solid foundation. Finish the remaining exercises to lock in these concepts.", actionLabel: "Continue Learning" },
    practiceCards: [
      { title: "Syntax Quiz", description: "Test your knowledge of the core syntax rules.", progressLabel: "Score 80% or higher to pass", badge: "Quiz", status: "in_progress", actionLabel: "Continue" },
    ],
  },

  "lesson-2a": {
    info: {
      title: "About this lesson",
      body: "Key terminology gives you the shared vocabulary to communicate ideas clearly. Each term maps to a concrete concept you'll use repeatedly.",
    },
    learning: {
      title: "Lesson Content",
      estimatedTime: "~10 min",
      lessons: [
        { title: "Study the glossary", description: "30 essential terms with examples", state: "completed", duration: "5 min" },
        { title: "Match terms to definitions", state: "completed", duration: "5 min" },
      ],
      practices: [
        { title: "Complete the terminology quiz", state: "completed", duration: "3 min" },
      ],
    },
    goal: null,
    practiceCards: [],
  },

  "lesson-2b": {
    info: {
      title: "About this lesson",
      body: "Fundamental principles underpin every decision you'll make as a developer. Understanding them deeply will save you hours of debugging later.",
    },
    learning: {
      title: "Lesson Content",
      estimatedTime: "~12 min",
      lessons: [
        { title: "Read the principle breakdown", description: "Each principle explained with diagrams", state: "in_progress", duration: "7 min" },
        { title: "Study the comparison table", state: "not_started", duration: "5 min" },
      ],
      practices: [
        { title: "Apply principles to a code review", state: "not_started", duration: "10 min" },
      ],
    },
    goal: null,
    practiceCards: [],
  },

  "checkpoint-1": {
    info: {
      title: "About this checkpoint",
      body: "This quiz covers everything from Milestone 1. It's designed to confirm you're ready to move on to the deep dive material.",
    },
    learning: null,
    goal: null,
    practiceCards: [
      { title: "Knowledge Check Quiz", description: "15 multiple-choice questions covering fundamentals.", progressLabel: "Score 80% or higher to pass", badge: "Quiz", status: "not_started", actionLabel: "Start Quiz" },
      { title: "Quick Code Challenge", description: "Write a short program using what you've learned.", progressLabel: "All test cases must pass", badge: "Exercise", status: "not_started", actionLabel: "Start", disabled: true },
    ],
  },

  "lesson-3": {
    info: {
      title: "About this unit",
      body: "Advanced patterns build on the core concepts. You'll learn idiomatic approaches that separate beginners from experienced developers.",
    },
    learning: {
      title: "Lesson Content",
      estimatedTime: "~20 min",
      lessons: [
        { title: "Study the pattern catalog", description: "8 patterns with code examples", state: "not_started", duration: "8 min" },
        { title: "Walk through the refactoring demo", state: "not_started", duration: "7 min" },
        { title: "Read the trade-off analysis", state: "not_started", duration: "5 min" },
      ],
      practices: [
        { title: "Refactor a provided codebase", state: "not_started", duration: "15 min" },
        { title: "Identify patterns in sample code", state: "not_started", duration: "10 min" },
      ],
    },
    goal: { title: "Level up!", description: "These patterns will make your code cleaner and more maintainable. Take your time absorbing each one.", actionLabel: "Start Patterns" },
    practiceCards: [
      { title: "Pattern Recognition Quiz", description: "Identify which pattern applies to each scenario.", progressLabel: "Score 80% or higher to pass", badge: "Quiz", status: "not_started", actionLabel: "Start Quiz", disabled: true },
      { title: "Refactoring Exercise", description: "Rewrite legacy code using modern patterns.", progressLabel: "All test cases must pass", badge: "Exercise", status: "not_started", actionLabel: "Start", disabled: true },
    ],
  },

  "lesson-4": {
    info: {
      title: "About this unit",
      body: "See how the concepts you've learned apply to real production systems. These case studies bridge the gap between theory and practice.",
    },
    learning: {
      title: "Lesson Content",
      estimatedTime: "~18 min",
      lessons: [
        { title: "Read the case study: authentication flow", state: "not_started", duration: "6 min" },
        { title: "Analyze the case study: data pipeline", state: "not_started", duration: "7 min" },
        { title: "Review the case study: error handling", state: "not_started", duration: "5 min" },
      ],
      practices: [
        { title: "Map each case study to a pattern", state: "not_started", duration: "10 min" },
        { title: "Write a short analysis of one case study", state: "not_started", duration: "15 min" },
      ],
    },
    goal: null,
    practiceCards: [
      { title: "Case Study Quiz", description: "Answer questions about the real-world scenarios.", progressLabel: "Score 80% or higher to pass", badge: "Quiz", status: "not_started", actionLabel: "Start Quiz", disabled: true },
    ],
  },

  "lesson-5": {
    info: {
      title: "About this unit",
      body: "Best practices are the habits that keep your codebase healthy over time. They cover naming, structure, testing, and collaboration.",
    },
    learning: {
      title: "Lesson Content",
      estimatedTime: "~14 min",
      lessons: [
        { title: "Read the best practices guide", description: "20 rules organized by category", state: "not_started", duration: "7 min" },
        { title: "Review the anti-patterns catalog", state: "not_started", duration: "4 min" },
        { title: "Study the team workflow checklist", state: "not_started", duration: "3 min" },
      ],
      practices: [
        { title: "Audit a sample project for violations", state: "not_started", duration: "10 min" },
      ],
    },
    goal: { title: "Almost there!", description: "These practices will make you a stronger collaborator. Review them before the final project.", actionLabel: "Review Practices" },
    practiceCards: [],
  },

  "lesson-6": {
    info: {
      title: "About this unit",
      body: "The final review consolidates everything you've learned. Use it as a reference sheet and a confidence check before the capstone.",
    },
    learning: {
      title: "Lesson Content",
      estimatedTime: "~10 min",
      lessons: [
        { title: "Skim the concept summary", description: "One-page cheat sheet for all milestones", state: "not_started", duration: "3 min" },
        { title: "Revisit weak areas", state: "not_started", duration: "5 min" },
        { title: "Complete the self-assessment", state: "not_started", duration: "2 min" },
      ],
      practices: [
        { title: "Teach a concept to someone else", state: "not_started", duration: "5 min" },
      ],
    },
    goal: null,
    practiceCards: [],
  },

  "checkpoint-2": {
    info: {
      title: "About this checkpoint",
      body: "The final project pulls together every skill from the course. You'll build something real and demonstrate mastery of the material.",
    },
    learning: null,
    goal: null,
    practiceCards: [
      { title: "Final Project", description: "Build a complete application that demonstrates all course concepts.", progressLabel: "Requires completion of all lessons first", badge: "Project", status: "not_started", actionLabel: "Start", disabled: true },
      { title: "Self-Assessment", description: "Reflect on your learning and identify areas for future growth.", progressLabel: "Complete honestly for best results", badge: "Reflection", status: "not_started", actionLabel: "Begin" },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatMinutes(mins: number): string {
  if (mins < 60) return `~${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function StudyPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedId, setSelectedId] = useState<string | null>("lesson-1");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");

  const courseName = "Course";
  const lessonCount = 8;
  const totalMinutes = 150;

  /* Derived data */
  const allItems = PLACEHOLDER_GROUPS.flatMap((g) =>
    g.items.flatMap((item) => [item, ...(item.children ?? [])]),
  );

  const filteredGroups = sidebarSearch.trim()
    ? PLACEHOLDER_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter(
          (item) =>
            item.label.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
            item.children?.some((c) => c.label.toLowerCase().includes(sidebarSearch.toLowerCase())),
        ),
      })).filter((g) => g.items.length > 0)
    : PLACEHOLDER_GROUPS;

  const selectedLabel = allItems.find((i) => i.id === selectedId)?.label ?? "";
  const selectedMilestone =
    PLACEHOLDER_GROUPS.find((g) => g.items.some((i) => i.id === selectedId))?.title ?? "";

  const headerItems = allItems.map((i) => ({
    id: i.id,
    label: i.label,
    status: PLACEHOLDER_STATUSES[i.id] ?? ("not_started" as LessonStatus),
  }));

  const content = selectedId ? CONTENT_MAP[selectedId] : null;

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
          <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed top-14 bottom-0 left-0 z-30 flex w-72 flex-col border-r border-gray-200 bg-white transition-all duration-200 lg:top-16 ${
          sidebarCollapsed
            ? "-translate-x-full"
            : sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
        }`}>
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-semibold text-gray-900">{courseName}</h2>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {lessonCount} lessons · {formatMinutes(totalMinutes)} total
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
                onSelect={(itemId) => { setSelectedId(itemId); setSidebarOpen(false); }}
              />
            ))}
            {filteredGroups.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-gray-400">No lessons match your search.</p>
            )}
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main className={`min-h-0 flex-1 overflow-y-auto ${sidebarCollapsed ? "lg:pl-0" : "lg:pl-72"}`}>
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
                { label: courseName, to: `/courses/${id}` },
                { label: selectedMilestone },
                { label: selectedLabel },
              ]}
              items={headerItems}
              selectedId={selectedId}
              onSelect={setSelectedId}
              meta={[
                { label: "50 mastery points", icon: STAR_ICON },
                { label: "~30 min" },
                { label: "8 lessons" },
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
                      <LessonItem key={l.title} title={l.title} description={l.description} state={l.state} duration={l.duration} content={l.content} onClick={() => {}} />
                    ))}
                  </>
                }
                practiceContent={
                  <>
                    {content.learning.practices.map((p) => (
                      <LessonItem key={p.title} title={p.title} description={p.description} state={p.state} duration={p.duration} content={p.content} onClick={() => {}} />
                    ))}
                  </>
                }
              />
            )}

            {content?.goal && (
              <GoalCard title={content.goal.title} description={content.goal.description} actionLabel={content.goal.actionLabel} />
            )}

            {content?.practiceCards && content.practiceCards.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {content.practiceCards.map((pc) => (
                  <PracticeCard key={pc.badge} title={pc.title} description={pc.description} progressLabel={pc.progressLabel} badge={pc.badge} status={pc.status} actionLabel={pc.actionLabel} disabled={pc.disabled} />
                ))}
              </div>
            )}

            <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5">
                <Button variant="ghost" size="sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                  </svg>
                  Previous lesson
                </Button>
                <Button variant="ghost" size="sm">
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
