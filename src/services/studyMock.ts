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
  if (!content) {
    // No content at all for this item — synthesise a fully mocked entry.
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
      : {
          title: `MOCK About this item`,
          body:  `MOCK No description has been provided for this item yet (id: ${id}).`,
        },

    learning: content.learning
      ? {
          title:         mockStr(content.learning.title,         "Lesson Content"),
          estimatedTime: mockStr(content.learning.estimatedTime, "~10 min"),
          lessons: content.learning.lessons.length > 0
            ? content.learning.lessons.map(patchLessonItem)
            : [
                { title: "MOCK Read the material",  state: "not_started", duration: "MOCK 5 min" },
                { title: "MOCK Review the summary", state: "not_started", duration: "MOCK 5 min" },
              ],
          practices: content.learning.practices.length > 0
            ? content.learning.practices.map(patchLessonItem)
            : [
                { title: "MOCK Complete the exercise", state: "not_started", duration: "MOCK 5 min" },
              ],
        }
      : null,

    goal: content.goal
      ? {
          title:       mockStr(content.goal.title,       "Keep going!"),
          description: mockStr(content.goal.description, "Complete this item to advance."),
          actionLabel: mockStr(content.goal.actionLabel, "Continue"),
        }
      : {
          title:       "MOCK Keep going!",
          description: "MOCK Complete this item to advance to the next section.",
          actionLabel: "MOCK Continue",
        },

    practiceCards: content.practiceCards.length > 0
      ? content.practiceCards.map(patchPracticeCard)
      : [],
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
      : [
          {
            title: "MOCK Section 1 — Getting Started",
            items: [
              { id: "mock-lesson-1", label: "MOCK Introduction", status: "not_started" as const },
              { id: "mock-lesson-2", label: "MOCK Core Concepts", status: "not_started" as const },
            ],
          },
        ];

    const progressItems = real.progressItems.length > 0
      ? real.progressItems.map(patchProgressItem)
      : groups
          .flatMap((g) => g.items.flatMap((i) => [i, ...(i.children ?? [])]))
          .map((i) => ({ id: i.id, label: i.label, status: "not_started" as const }));

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
