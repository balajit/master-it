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
import type { ContentItem } from "../types/contentNode";
import type { LessonStatus } from "../components/study/statusConfig";

// ── Static mock data ──────────────────────────────────────────────────────────

const STATIC_MOCK_GROUPS: StudyGroup[] = [
  {
    title: "Chapter 1 — Foundations",
    items: [
      { id: "lesson-1", label: "Introduction to the Course", status: "completed" },
      { id: "lesson-2", label: "Core Concepts", status: "in_progress" },
      { id: "lesson-3", label: "Key Terminology", status: "not_started" },
    ],
  },
  {
    title: "Chapter 2 — Deep Dive",
    items: [
      { id: "lesson-4", label: "Advanced Patterns", status: "not_started" },
      { id: "lesson-5", label: "Real-World Applications", status: "not_started" },
    ],
  },
  {
    title: "Chapter 3 — Mastery",
    items: [
      { id: "lesson-6", label: "Best Practices", status: "not_started" },
      { id: "lesson-7", label: "Final Review", status: "not_started" },
    ],
  },
];

const STATIC_MOCK_STATUSES: Record<string, LessonStatus> = {
  "lesson-1": "mastered",
  "lesson-2": "practiced",
  "lesson-3": "familiar",
  "lesson-4": "attempted",
  "lesson-5": "not_started",
  "lesson-6": "not_started",
  "lesson-7": "not_started",
};

const MOCK_CONTENT_ITEMS: ContentItem[] = [
  {
    id:      "mock-h1",
    type:    "heading",
    order:   0,
    content: "MOCK Section Heading",
    level:   2,
  },
  {
    id:      "mock-t1",
    type:    "text",
    order:   1,
    content: "MOCK This is a placeholder paragraph. Real content will be provided by the backend once the course material has been processed.",
    level:   0,
  },
  {
    id:      "mock-eq1",
    type:    "equation",
    order:   2,
    latex:   "E = mc^2",
  },
  {
    id:      "mock-l1",
    type:    "list",
    order:   3,
    ordered: false,
    items:   [
      "MOCK First key point from the reading",
      "MOCK Second key point from the reading",
      "MOCK Third key point from the reading",
    ],
  },
];

const STATIC_MOCK_CONTENT: Record<string, StudyContent> = {
  "lesson-1": {
    info: {
      title: "MOCK About this lesson",
      body:  "MOCK This unit introduces the foundational concepts you'll need before moving on to more advanced topics.",
    },
    learning: {
      title:         "MOCK Lesson Content",
      estimatedTime: "",
      lessons: [
        {
          title:       "MOCK Page 1 — Overview",
          state:       "completed",
          content:     MOCK_CONTENT_ITEMS,
        },
        {
          title:       "MOCK Page 2 — Key Concepts",
          state:       "in_progress",
        },
      ],
      practices: [],
    },
    goal:          null,
    practiceCards: [],
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
      : undefined,
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
  const staticFallback = STATIC_MOCK_CONTENT[id];

  if (!content) {
    if (staticFallback) return staticFallback;
    return {
      info: {
        title: "MOCK About this lesson",
        body:  `MOCK No description has been provided for this item yet (id: ${id}).`,
      },
      learning: {
        title:         "MOCK Lesson Content",
        estimatedTime: "",
        lessons: [
          {
            title:   "MOCK Read the material",
            state:   "not_started",
            content: MOCK_CONTENT_ITEMS,
          },
        ],
        practices: [],
      },
      goal:          null,
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
          title: "MOCK About this lesson",
          body:  `MOCK No description available for id: ${id}.`,
        },

    learning: content.learning
      ? {
          title:         mockStr(content.learning.title,         "Lesson Content"),
          estimatedTime: content.learning.estimatedTime,
          lessons: content.learning.lessons.length > 0
            ? content.learning.lessons.map(patchLessonItem)
            : staticFallback?.learning?.lessons ?? [
                { title: "MOCK Read the material", state: "not_started", content: MOCK_CONTENT_ITEMS },
              ],
          practices: content.learning.practices.map(patchLessonItem),
        }
      : staticFallback?.learning ?? null,

    goal: content.goal
      ? {
          title:       mockStr(content.goal.title,       "Keep going!"),
          description: mockStr(content.goal.description, "Complete this item to advance."),
          actionLabel: mockStr(content.goal.actionLabel, "Continue"),
        }
      : staticFallback?.goal ?? null,

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
    title: mockStr(group.title, `Chapter ${groupIndex + 1}`),
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
    const real = await this._api.getStudyPage(courseId);

    const groups = real.groups.length > 0
      ? real.groups.map(patchGroup)
      : STATIC_MOCK_GROUPS;

    const progressItems = real.progressItems.length > 0
      ? real.progressItems.map(patchProgressItem)
      : groups
          .flatMap((g) => g.items.flatMap((i) => [i, ...(i.children ?? [])]))
          .map((i) => ({
            id:     i.id,
            label:  i.label,
            status: (STATIC_MOCK_STATUSES[i.id] ?? "not_started") as StudyProgressItem["status"],
          }));

    const allIds = groups
      .flatMap((g) => g.items.flatMap((i) => [i, ...(i.children ?? [])]))
      .map((i) => i.id);

    const contentMap: Record<string, StudyContent> = {};
    for (const id of allIds) {
      contentMap[id] = patchContent(id, real.contentMap[id]);
    }

    return {
      courseTitle:   mockStr(real.courseTitle, "Course"),
      lessonCount:   real.lessonCount  > 0 ? real.lessonCount  : groups.flatMap((g) => g.items).length,
      totalMinutes:  real.totalMinutes,
      groups,
      progressItems,
      contentMap,
      lessonDbIdMap: real.lessonDbIdMap,
      resumeLessonId: real.resumeLessonId ?? groups[0]?.items[0]?.id ?? null,
    };
  }
}
