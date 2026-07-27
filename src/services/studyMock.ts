/**
 * studyMock.ts — Mock decorator for StudyService.
 *
 * Calls the real API first via ApiStudyService. For every field that the API
 * returns empty, null, or missing, fills in a "MOCK ..." placeholder so the
 * UI always has something to render. Real data always takes precedence.
 *
 * This is intentionally NOT a standalone stub — it chains to the real API so
 * that as the backend ships new fields, they automatically appear in the UI
 * without any changes here.
 *
 * Usage: set VITE_USE_MOCK_STUDY=true in .env.local to activate.
 * The real API is still called; only gaps are patched with mock values.
 */

import { ApiStudyService } from "./studyApi";
import type {
  StudyService,
  StudyPageData,
  StudyGroup,
  StudyItem,
  StudyContent,
  StudyProgressItem,
  LessonItemDef,
  PracticeCardDef,
} from "./study";
import type { ContentNode } from "../types/contentNode";
import type { LessonStatus } from "../components/study/statusConfig";

// ── Static mock data (ported from the original fully-static StudyPage) ─────────

const STATIC_MOCK_GROUPS: StudyGroup[] = [
  {
    title: "Milestone 1 — Foundations",
    items: [
      {
        id: "lesson-1",
        label: "Introduction to the Course",
        status: "completed",
        children: [
          { id: "lesson-1a", label: "Course overview", status: "completed" },
          { id: "lesson-1b", label: "Learning objectives", status: "completed" },
        ],
      },
      {
        id: "lesson-2",
        label: "Core Concepts",
        status: "in_progress",
        children: [
          { id: "lesson-2a", label: "Key terminology", status: "completed" },
          { id: "lesson-2b", label: "Fundamental principles", status: "in_progress" },
        ],
      },
      { id: "checkpoint-1", label: "Knowledge Check", status: "not_started", meta: "Quiz" },
    ],
  },
  {
    title: "Milestone 2 — Deep Dive",
    items: [
      { id: "lesson-3", label: "Advanced Patterns", status: "not_started" },
      { id: "lesson-4", label: "Real-World Applications", status: "not_started" },
    ],
  },
  {
    title: "Milestone 3 — Mastery",
    items: [
      { id: "lesson-5", label: "Best Practices", status: "not_started" },
      { id: "lesson-6", label: "Final Review", status: "not_started" },
      { id: "checkpoint-2", label: "Final Project", status: "not_started", meta: "Project" },
    ],
  },
];

const STATIC_MOCK_STATUSES: Record<string, LessonStatus> = {
  "lesson-1":    "mastered",
  "lesson-1a":   "mastered",
  "lesson-1b":   "mastered",
  "lesson-2":    "practiced",
  "lesson-2a":   "mastered",
  "lesson-2b":   "practiced",
  "checkpoint-1":"familiar",
  "lesson-3":    "attempted",
  "lesson-4":    "not_started",
  "lesson-5":    "not_started",
  "lesson-6":    "not_started",
  "checkpoint-2":"not_started",
};

const STATIC_MOCK_CONTENT: Record<string, StudyContent> = {
  "lesson-1": {
    info: {
      title: "About this unit",
      body: "MOCK This unit introduces the foundational concepts you'll need before moving on to more advanced topics. Take your time with the material and make sure you're comfortable with each idea before proceeding.",
    },
    learning: {
      title: "MOCK Lesson Content",
      estimatedTime: "MOCK ~15 min",
      lessons: [
        { title: "MOCK Read the unit overview", description: "MOCK Understand the goals and scope of this lesson", state: "completed", duration: "MOCK 5 min" },
        { title: "MOCK Watch the introductory video", description: "MOCK A 3-minute overview of core ideas", state: "completed", duration: "MOCK 3 min" },
        { title: "MOCK Review the key vocabulary", state: "in_progress", duration: "MOCK 7 min" },
      ],
      practices: [
        { title: "MOCK Complete the guided examples", state: "completed", duration: "MOCK 8 min" },
        { title: "MOCK Try the ungraded practice quiz", description: "MOCK Test yourself before moving on", state: "not_started", duration: "MOCK 5 min" },
      ],
    },
    goal: { title: "MOCK Great start!", description: "MOCK You've covered the fundamentals. Keep this momentum going into the deep dive.", actionLabel: "MOCK Start Deep Dive" },
    practiceCards: [],
  },

  "lesson-1a": {
    info: {
      title: "MOCK About this lesson",
      body: "MOCK Get a high-level view of the course structure, what you'll build, and how the milestones connect. This overview helps you plan your study schedule.",
    },
    learning: {
      title: "MOCK Lesson Content",
      estimatedTime: "MOCK ~8 min",
      lessons: [
        { title: "MOCK Scan the course roadmap", description: "MOCK Visual map of all milestones and lessons", state: "completed", duration: "MOCK 3 min" },
        { title: "MOCK Review the syllabus summary", state: "completed", duration: "MOCK 5 min" },
      ],
      practices: [
        { title: "MOCK Identify your target completion date", state: "completed", duration: "MOCK 2 min" },
      ],
    },
    goal: null,
    practiceCards: [],
  },

  "lesson-1b": {
    info: {
      title: "MOCK About this lesson",
      body: "MOCK Clear learning objectives help you focus on what matters. Each objective maps to a specific skill you'll demonstrate by the end of this milestone.",
    },
    learning: {
      title: "MOCK Lesson Content",
      estimatedTime: "MOCK ~6 min",
      lessons: [
        { title: "MOCK Read the learning objectives", description: "MOCK Five key outcomes for this course", state: "completed", duration: "MOCK 3 min" },
        { title: "MOCK Self-assess your starting point", state: "completed", duration: "MOCK 3 min" },
      ],
      practices: [],
    },
    goal: null,
    practiceCards: [],
  },

  "lesson-2": {
    info: {
      title: "MOCK About this unit",
      body: "MOCK Core concepts form the backbone of this course. Master these building blocks and everything else will click into place.",
    },
    learning: {
      title: "MOCK Lesson Content",
      estimatedTime: "MOCK ~25 min",
      lessons: [
        {
          title: "MOCK Study the core definitions",
          description: "MOCK Essential terms you'll use throughout",
          state: "completed",
          duration: "MOCK 8 min",
          content: [
            {
              type: "heading",
              level: 2,
              text: "Chemical Reactions — Core Definitions",
            },
            {
              type: "paragraph",
              runs: [
                {
                  run_type: "text",
                  text: "Chemical reactions involve the transformation of one set of chemicals into another. ",
                },
                { run_type: "bold", text: "Reactants" },
                {
                  run_type: "text",
                  text: " are the starting materials, and ",
                },
                { run_type: "bold", text: "products" },
                {
                  run_type: "text",
                  text: " are the substances formed after the reaction completes.",
                },
              ],
            },
            {
              type: "note",
              variant: "tip",
              runs: [
                {
                  run_type: "text",
                  text: "The law of conservation of mass states that atoms are neither created nor destroyed — they are simply rearranged.",
                },
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "Balancing Equations",
            },
            {
              type: "paragraph",
              runs: [
                {
                  run_type: "text",
                  text: "A balanced equation ensures the same number of atoms of each element appear on both sides. For example, the synthesis of water:",
                },
              ],
            },
            {
              type: "equation",
              latex: "2H_2 + O_2 \\rightarrow 2H_2O",
              label: "",
            },
            {
              type: "paragraph",
              runs: [
                {
                  run_type: "text",
                  text: "And the combustion of methane, where each carbon atom produces one ",
                },
                { run_type: "eq", latex: "CO_2" },
                { run_type: "text", text: " molecule:" },
              ],
            },
            {
              type: "equation",
              latex: "CH_4 + 2O_2 \\rightarrow CO_2 + 2H_2O",
              label: "",
            },
            {
              type: "list",
              style: "bullet",
              items: [
                { runs: [{ run_type: "text", text: "Reactants are on the left side of the arrow" }] },
                { runs: [{ run_type: "text", text: "Products are on the right side of the arrow" }] },
                { runs: [{ run_type: "text", text: "Coefficients balance atom counts on each side" }] },
              ],
            },
          ] satisfies ContentNode[],
        },
        {
          title: "MOCK Work through the syntax guide",
          description: "MOCK Hands-on walkthrough of basic syntax",
          state: "in_progress",
          duration: "MOCK 10 min",
          content: [
            {
              type: "heading",
              level: 2,
              text: "Balanced Equation Examples",
            },
            {
              type: "paragraph",
              runs: [
                {
                  run_type: "text",
                  text: "Work through each balanced equation below. Notice how the coefficient in front of each formula ensures equal atom counts on both sides.",
                },
              ],
            },
            {
              type: "definition",
              term: "Coefficient",
              definition:
                "A number placed in front of a chemical formula in a balanced equation to indicate the relative number of moles of that substance.",
            },
            {
              type: "heading",
              level: 3,
              text: "Rust Formation",
            },
            {
              type: "equation",
              latex: "4Fe + 3O_2 \\rightarrow 2Fe_2O_3",
              label: "(1)",
            },
            {
              type: "heading",
              level: 3,
              text: "Photosynthesis",
            },
            {
              type: "equation",
              latex: "6CO_2 + 6H_2O \\rightarrow C_6H_{12}O_6 + 6O_2",
              label: "(2)",
            },
            {
              type: "heading",
              level: 3,
              text: "Acid-Base Neutralization",
            },
            {
              type: "paragraph",
              runs: [
                { run_type: "text", text: "When hydrochloric acid reacts with sodium hydroxide, " },
                { run_type: "eq", latex: "HCl + NaOH \\rightarrow NaCl + H_2O" },
                { run_type: "text", text: ". The resulting salt is " },
                { run_type: "eq", latex: "NaCl" },
                { run_type: "text", text: " (table salt)." },
              ],
            },
            {
              type: "callout",
              variant: "example",
              title: "Try It",
              runs: [
                {
                  run_type: "text",
                  text: "Balance the decomposition of calcium carbonate: CaCO₃ → CaO + CO₂. Is it already balanced? Count the atoms on each side to verify.",
                },
              ],
            },
            {
              type: "note",
              variant: "warning",
              runs: [
                {
                  run_type: "text",
                  text: "Never change the subscripts inside a chemical formula when balancing — only adjust the coefficients in front.",
                },
              ],
            },
          ] satisfies ContentNode[],
        },
        { title: "MOCK Follow the interactive tutorial", state: "not_started", duration: "MOCK 7 min" },
      ],
      practices: [
        { title: "MOCK Complete the syntax exercises", state: "in_progress", duration: "MOCK 10 min" },
        { title: "MOCK Build a simple example from scratch", state: "not_started", duration: "MOCK 15 min" },
      ],
    },
    goal: { title: "MOCK Keep going!", description: "MOCK You're building a solid foundation. Finish the remaining exercises to lock in these concepts.", actionLabel: "MOCK Continue Learning" },
    practiceCards: [
      { title: "MOCK Syntax Quiz", description: "MOCK Test your knowledge of the core syntax rules.", progressLabel: "MOCK Score 80% or higher to pass", badge: "MOCK Quiz", status: "in_progress", actionLabel: "MOCK Continue" },
    ],
  },

  "lesson-2a": {
    info: {
      title: "MOCK About this lesson",
      body: "MOCK Key terminology gives you the shared vocabulary to communicate ideas clearly. Each term maps to a concrete concept you'll use repeatedly.",
    },
    learning: {
      title: "MOCK Lesson Content",
      estimatedTime: "MOCK ~10 min",
      lessons: [
        { title: "MOCK Study the glossary", description: "MOCK 30 essential terms with examples", state: "completed", duration: "MOCK 5 min" },
        { title: "MOCK Match terms to definitions", state: "completed", duration: "MOCK 5 min" },
      ],
      practices: [
        { title: "MOCK Complete the terminology quiz", state: "completed", duration: "MOCK 3 min" },
      ],
    },
    goal: null,
    practiceCards: [],
  },

  "lesson-2b": {
    info: {
      title: "MOCK About this lesson",
      body: "MOCK Fundamental principles underpin every decision you'll make as a developer. Understanding them deeply will save you hours of debugging later.",
    },
    learning: {
      title: "MOCK Lesson Content",
      estimatedTime: "MOCK ~12 min",
      lessons: [
        { title: "MOCK Read the principle breakdown", description: "MOCK Each principle explained with diagrams", state: "in_progress", duration: "MOCK 7 min" },
        { title: "MOCK Study the comparison table", state: "not_started", duration: "MOCK 5 min" },
      ],
      practices: [
        { title: "MOCK Apply principles to a code review", state: "not_started", duration: "MOCK 10 min" },
      ],
    },
    goal: null,
    practiceCards: [],
  },

  "checkpoint-1": {
    info: {
      title: "MOCK About this checkpoint",
      body: "MOCK This quiz covers everything from Milestone 1. It's designed to confirm you're ready to move on to the deep dive material.",
    },
    learning: null,
    goal: null,
    practiceCards: [
      { title: "MOCK Knowledge Check Quiz", description: "MOCK 15 multiple-choice questions covering fundamentals.", progressLabel: "MOCK Score 80% or higher to pass", badge: "MOCK Quiz", status: "not_started", actionLabel: "MOCK Start Quiz" },
      { title: "MOCK Quick Code Challenge", description: "MOCK Write a short program using what you've learned.", progressLabel: "MOCK All test cases must pass", badge: "MOCK Exercise", status: "not_started", actionLabel: "MOCK Start", disabled: true },
    ],
  },

  "lesson-3": {
    info: {
      title: "MOCK About this unit",
      body: "MOCK Advanced patterns build on the core concepts. You'll learn idiomatic approaches that separate beginners from experienced developers.",
    },
    learning: {
      title: "MOCK Lesson Content",
      estimatedTime: "MOCK ~20 min",
      lessons: [
        { title: "MOCK Study the pattern catalog", description: "MOCK 8 patterns with code examples", state: "not_started", duration: "MOCK 8 min" },
        { title: "MOCK Walk through the refactoring demo", state: "not_started", duration: "MOCK 7 min" },
        { title: "MOCK Read the trade-off analysis", state: "not_started", duration: "MOCK 5 min" },
      ],
      practices: [
        { title: "MOCK Refactor a provided codebase", state: "not_started", duration: "MOCK 15 min" },
        { title: "MOCK Identify patterns in sample code", state: "not_started", duration: "MOCK 10 min" },
      ],
    },
    goal: { title: "MOCK Level up!", description: "MOCK These patterns will make your code cleaner and more maintainable. Take your time absorbing each one.", actionLabel: "MOCK Start Patterns" },
    practiceCards: [
      { title: "MOCK Pattern Recognition Quiz", description: "MOCK Identify which pattern applies to each scenario.", progressLabel: "MOCK Score 80% or higher to pass", badge: "MOCK Quiz", status: "not_started", actionLabel: "MOCK Start Quiz", disabled: true },
      { title: "MOCK Refactoring Exercise", description: "MOCK Rewrite legacy code using modern patterns.", progressLabel: "MOCK All test cases must pass", badge: "MOCK Exercise", status: "not_started", actionLabel: "MOCK Start", disabled: true },
    ],
  },

  "lesson-4": {
    info: {
      title: "MOCK About this unit",
      body: "MOCK See how the concepts you've learned apply to real production systems. These case studies bridge the gap between theory and practice.",
    },
    learning: {
      title: "MOCK Lesson Content",
      estimatedTime: "MOCK ~18 min",
      lessons: [
        { title: "MOCK Read the case study: authentication flow", state: "not_started", duration: "MOCK 6 min" },
        { title: "MOCK Analyze the case study: data pipeline", state: "not_started", duration: "MOCK 7 min" },
        { title: "MOCK Review the case study: error handling", state: "not_started", duration: "MOCK 5 min" },
      ],
      practices: [
        { title: "MOCK Map each case study to a pattern", state: "not_started", duration: "MOCK 10 min" },
        { title: "MOCK Write a short analysis of one case study", state: "not_started", duration: "MOCK 15 min" },
      ],
    },
    goal: null,
    practiceCards: [
      { title: "MOCK Case Study Quiz", description: "MOCK Answer questions about the real-world scenarios.", progressLabel: "MOCK Score 80% or higher to pass", badge: "MOCK Quiz", status: "not_started", actionLabel: "MOCK Start Quiz", disabled: true },
    ],
  },

  "lesson-5": {
    info: {
      title: "MOCK About this unit",
      body: "MOCK Best practices are the habits that keep your codebase healthy over time. They cover naming, structure, testing, and collaboration.",
    },
    learning: {
      title: "MOCK Lesson Content",
      estimatedTime: "MOCK ~14 min",
      lessons: [
        { title: "MOCK Read the best practices guide", description: "MOCK 20 rules organized by category", state: "not_started", duration: "MOCK 7 min" },
        { title: "MOCK Review the anti-patterns catalog", state: "not_started", duration: "MOCK 4 min" },
        { title: "MOCK Study the team workflow checklist", state: "not_started", duration: "MOCK 3 min" },
      ],
      practices: [
        { title: "MOCK Audit a sample project for violations", state: "not_started", duration: "MOCK 10 min" },
      ],
    },
    goal: { title: "MOCK Almost there!", description: "MOCK These practices will make you a stronger collaborator. Review them before the final project.", actionLabel: "MOCK Review Practices" },
    practiceCards: [],
  },

  "lesson-6": {
    info: {
      title: "MOCK About this unit",
      body: "MOCK The final review consolidates everything you've learned. Use it as a reference sheet and a confidence check before the capstone.",
    },
    learning: {
      title: "MOCK Lesson Content",
      estimatedTime: "MOCK ~10 min",
      lessons: [
        { title: "MOCK Skim the concept summary", description: "MOCK One-page cheat sheet for all milestones", state: "not_started", duration: "MOCK 3 min" },
        { title: "MOCK Revisit weak areas", state: "not_started", duration: "MOCK 5 min" },
        { title: "MOCK Complete the self-assessment", state: "not_started", duration: "MOCK 2 min" },
      ],
      practices: [
        { title: "MOCK Teach a concept to someone else", state: "not_started", duration: "MOCK 5 min" },
      ],
    },
    goal: null,
    practiceCards: [],
  },

  "checkpoint-2": {
    info: {
      title: "MOCK About this checkpoint",
      body: "MOCK The final project pulls together every skill from the course. You'll build something real and demonstrate mastery of the material.",
    },
    learning: null,
    goal: null,
    practiceCards: [
      { title: "MOCK Final Project", description: "MOCK Build a complete application that demonstrates all course concepts.", progressLabel: "MOCK Requires completion of all lessons first", badge: "MOCK Project", status: "not_started", actionLabel: "MOCK Start", disabled: true },
      { title: "MOCK Self-Assessment", description: "MOCK Reflect on your learning and identify areas for future growth.", progressLabel: "MOCK Complete honestly for best results", badge: "MOCK Reflection", status: "not_started", actionLabel: "MOCK Begin" },
    ],
  },
};

// ── Field-level patchers ──────────────────────────────────────────────────────

function mockStr(value: string | undefined | null, fallback: string): string {
  return value && value.trim().length > 0 ? value : `MOCK ${fallback}`;
}

function patchLessonItem(item: LessonItemDef, index: number): LessonItemDef {
  return {
    ...item,
    title:       mockStr(item.title,       `Lesson step ${index + 1}`),
    description: item.description && item.description.trim().length > 0
      ? item.description
      : undefined,
    duration:    item.duration && item.duration.trim().length > 0
      ? item.duration
      : `MOCK ${(index + 1) * 5} min`,
  };
}

function patchPracticeCard(pc: PracticeCardDef, index: number): PracticeCardDef {
  return {
    ...pc,
    title:         mockStr(pc.title,         `Activity ${index + 1}`),
    description:   mockStr(pc.description,   "Complete this activity to advance."),
    progressLabel: mockStr(pc.progressLabel, "Score required to pass"),
    badge:         mockStr(pc.badge,         "Activity"),
    actionLabel:   mockStr(pc.actionLabel,   "Start"),
  };
}

function patchContent(id: string, content: StudyContent | undefined): StudyContent {
  // Use the rich static mock as the base when the API returns nothing for this id.
  const staticFallback = STATIC_MOCK_CONTENT[id];

  if (!content) {
    // No API content at all — return the static mock if we have one, otherwise
    // synthesise a generic entry so the UI always has something to render.
    if (staticFallback) return staticFallback;
    return {
      info: {
        title: `MOCK About this item`,
        body:  `MOCK No description has been provided for this item yet (id: ${id}).`,
      },
      learning: {
        title:         "MOCK Lesson Content",
        estimatedTime: "MOCK ~10 min",
        lessons: [
          { title: "MOCK Read the material", state: "not_started", duration: "MOCK 5 min" },
          { title: "MOCK Review the summary", state: "not_started", duration: "MOCK 5 min" },
        ],
        practices: [
          { title: "MOCK Complete the exercise", state: "not_started", duration: "MOCK 5 min" },
        ],
      },
      goal: {
        title:       "MOCK Keep going!",
        description: "MOCK Complete this item to advance to the next section.",
        actionLabel: "MOCK Continue",
      },
      practiceCards: [],
    };
  }

  return {
    info: content.info
      ? {
          title: mockStr(content.info.title, "About this item"),
          body:  mockStr(content.info.body,  "No description available yet."),
        }
      : staticFallback?.info ?? {
          title: `MOCK About this item`,
          body:  `MOCK No description has been provided for this item yet (id: ${id}).`,
        },

    learning: content.learning
      ? {
          title:         mockStr(content.learning.title,         "Lesson Content"),
          estimatedTime: mockStr(content.learning.estimatedTime, "~10 min"),
          lessons: content.learning.lessons.length > 0
            ? content.learning.lessons.map(patchLessonItem)
            : staticFallback?.learning?.lessons ?? [
                { title: "MOCK Read the material",  state: "not_started", duration: "MOCK 5 min" },
                { title: "MOCK Review the summary", state: "not_started", duration: "MOCK 5 min" },
              ],
          practices: content.learning.practices.length > 0
            ? content.learning.practices.map(patchLessonItem)
            : staticFallback?.learning?.practices ?? [
                { title: "MOCK Complete the exercise", state: "not_started", duration: "MOCK 5 min" },
              ],
        }
      : staticFallback?.learning ?? null,

    goal: content.goal
      ? {
          title:       mockStr(content.goal.title,       "Keep going!"),
          description: mockStr(content.goal.description, "Complete this item to advance."),
          actionLabel: mockStr(content.goal.actionLabel, "Continue"),
        }
      : staticFallback?.goal ?? {
          title:       "MOCK Keep going!",
          description: "MOCK Complete this item to advance to the next section.",
          actionLabel: "MOCK Continue",
        },

    practiceCards: content.practiceCards.length > 0
      ? content.practiceCards.map(patchPracticeCard)
      : staticFallback?.practiceCards ?? [],
  };
}

function patchItem(item: StudyItem, groupIndex: number, itemIndex: number): StudyItem {
  return {
    ...item,
    label:    mockStr(item.label, `Item ${groupIndex + 1}.${itemIndex + 1}`),
    children: item.children?.map((child, ci) => patchItem(child, groupIndex, ci)),
  };
}

function patchGroup(group: StudyGroup, groupIndex: number): StudyGroup {
  return {
    title: mockStr(group.title, `Section ${groupIndex + 1}`),
    items: group.items.map((item, i) => patchItem(item, groupIndex, i)),
  };
}

function patchProgressItem(pi: StudyProgressItem, index: number): StudyProgressItem {
  return {
    ...pi,
    label: mockStr(pi.label, `Item ${index + 1}`),
  };
}

// ── Mock decorator ────────────────────────────────────────────────────────────

export class MockStudyService implements StudyService {
  private readonly _api: ApiStudyService;

  constructor() {
    this._api = new ApiStudyService();
  }

  async getStudyPage(courseId: string): Promise<StudyPageData> {
    // Always call the real API first.
    const real = await this._api.getStudyPage(courseId);

    // Patch every field that came back empty from the API.
    const groups = real.groups.length > 0
      ? real.groups.map(patchGroup)
      : STATIC_MOCK_GROUPS;

    const progressItems = real.progressItems.length > 0
      ? real.progressItems.map(patchProgressItem)
      : groups
          .flatMap((g) => g.items.flatMap((i) => [i, ...(i.children ?? [])]))
          .map((i) => ({ id: i.id, label: i.label, status: (STATIC_MOCK_STATUSES[i.id] ?? "not_started") as StudyProgressItem["status"] }));

    // Build a patched content map: patch real entries + synthesise missing ones.
    const allIds = groups
      .flatMap((g) => g.items.flatMap((i) => [i, ...(i.children ?? [])]))
      .map((i) => i.id);

    const contentMap: Record<string, StudyContent> = {};
    for (const id of allIds) {
      contentMap[id] = patchContent(id, real.contentMap[id]);
    }

    return {
      courseTitle:   mockStr(real.courseTitle,  "Course"),
      lessonCount:   real.lessonCount  > 0 ? real.lessonCount  : groups.flatMap((g) => g.items).length,
      totalMinutes:  real.totalMinutes > 0 ? real.totalMinutes : groups.flatMap((g) => g.items).length * 10,
      groups,
      progressItems,
      contentMap,
      // Resume: use real value if available, otherwise fall back to first item.
      resumeLessonId: real.resumeLessonId ?? groups[0]?.items[0]?.id ?? null,
    };
  }
}
