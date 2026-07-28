/**
 * studyApi.ts — Real API implementation of StudyService.
 *
 * Calls:
 *   GET /api/courses/{course_id}/study-plan  → CourseStudyPlanResponse
 *   GET /api/v1/users/me/courses/{course_id}/resume → ResumeResponse
 *
 * The study plan is structured as: Course → Chapter → Lesson → Page → ContentItem
 * Chapters map to sidebar groups; lessons map to selectable sidebar items.
 * Pages and their content items are rendered in the main panel.
 *
 * Each Lesson carries:
 *   - id: UUID string from the book pipeline (used as sidebar item id)
 *   - lesson_id: DB integer PK (LessonModel.id) — used for notes/progress APIs
 *   - unit_id: DB integer PK (UnitModel.id) — available if needed
 */

import client from "../api/client";
import type {
  StudyService,
  StudyPageData,
  StudyGroup,
  StudyItem,
  StudyProgressItem,
  StudyContent,
  ItemStatus,
  LessonItemDef,
} from "./study";
import type { components } from "../api/v1.d.ts";

type Chapter  = components["schemas"]["Chapter"];
type Lesson   = components["schemas"]["Lesson"];
type Page     = components["schemas"]["Page"];

// ── Resume response type ──────────────────────────────────────────────────────

interface ResumeResponse {
  lesson_id: number | null;
  unit_id:   number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function defaultItemStatus(): ItemStatus {
  return "not_started";
}

/**
 * Extract the first meaningful text from a lesson's pages to use as the
 * info card body. Returns an empty string if no text content is found.
 */
function extractInfoBody(pages: Page[]): string {
  for (const page of pages) {
    for (const item of page.items) {
      if (item.type === "text" && item.content.trim().length > 0) {
        return item.content.trim();
      }
    }
  }
  return "";
}

/**
 * Convert a Lesson's pages into LessonItemDef rows — one per page.
 * Each row carries the page's content items for inline rendering.
 */
function pagesToLessonItems(pages: Page[]): LessonItemDef[] {
  return [...pages]
    .sort((a, b) => a.order - b.order)
    .map((page) => ({
      title: `Page ${page.page_number > 0 ? page.page_number : page.order + 1}`,
      state:   "not_started" as const,
      content: page.items,
    }));
}

/**
 * Transform a single Lesson into its sidebar item, progress item, and content
 * map entry.
 */
function transformLesson(lesson: Lesson): {
  sidebarItem:   StudyItem;
  progressItem:  StudyProgressItem;
  contentEntry:  [string, StudyContent];
  dbIdEntry:     [string, number] | null;
} {
  const itemId = lesson.id;
  const status = defaultItemStatus();
  const infoBody = extractInfoBody(lesson.pages ?? []);

  const sidebarItem: StudyItem = {
    id:     itemId,
    label:  lesson.title || "Untitled Lesson",
    status,
  };

  const progressItem: StudyProgressItem = {
    id:     itemId,
    label:  lesson.title || "Untitled Lesson",
    status: "not_started",
  };

  const lessonItems: LessonItemDef[] = pagesToLessonItems(lesson.pages ?? []);

  const content: StudyContent = {
    info: {
      title: lesson.title || "Untitled Lesson",
      body:  infoBody || `No description available for "${lesson.title || "this lesson"}".`,
    },
    learning: lessonItems.length > 0
      ? {
          title:         lesson.title || "Lesson Content",
          estimatedTime: "",
          lessons:       lessonItems,
          practices:     [],
        }
      : null,
    goal:          null,
    practiceCards: [],
  };

  const dbIdEntry: [string, number] | null =
    lesson.lesson_id != null ? [itemId, lesson.lesson_id] : null;

  return { sidebarItem, progressItem, contentEntry: [itemId, content], dbIdEntry };
}

/**
 * Transform a Chapter into a StudyGroup and accumulate all derived data.
 */
function transformChapter(chapter: Chapter): {
  group:         StudyGroup;
  progressItems: StudyProgressItem[];
  contentMap:    Record<string, StudyContent>;
  lessonDbIdMap: Record<string, number>;
} {
  const progressItems: StudyProgressItem[]       = [];
  const contentMap:    Record<string, StudyContent> = {};
  const lessonDbIdMap: Record<string, number>    = {};

  const sortedLessons = [...(chapter.lessons ?? [])].sort((a, b) => a.order - b.order);

  const sidebarItems: StudyItem[] = sortedLessons.map((lesson) => {
    const { sidebarItem, progressItem, contentEntry, dbIdEntry } = transformLesson(lesson);
    progressItems.push(progressItem);
    contentMap[contentEntry[0]] = contentEntry[1];
    if (dbIdEntry) lessonDbIdMap[dbIdEntry[0]] = dbIdEntry[1];
    return sidebarItem;
  });

  return {
    group: {
      title: chapter.title || "Untitled Chapter",
      items: sidebarItems,
    },
    progressItems,
    contentMap,
    lessonDbIdMap,
  };
}

// ── API Service ───────────────────────────────────────────────────────────────

export class ApiStudyService implements StudyService {
  async getStudyPage(courseId: string): Promise<StudyPageData> {
    const courseIdNum = Number(courseId);

    // ── 1. Fetch study plan ───────────────────────────────────────────────────
    const { data: planData, error: planError } = await client.GET(
      "/api/courses/{course_id}/study-plan",
      { params: { path: { course_id: courseIdNum } } },
    );

    if (planError || !planData) {
      throw new Error(`Failed to load study plan: ${JSON.stringify(planError)}`);
    }

    // ── 2. Fetch resume lesson ────────────────────────────────────────────────
    let resumeLessonId: string | null = null;
    try {
      const token = localStorage.getItem("master_it_auth");
      const resumeRes = await fetch(
        `http://localhost:5000/api/v1/users/me/courses/${courseIdNum}/resume`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      if (resumeRes.ok) {
        const resumeJson = (await resumeRes.json()) as ResumeResponse;
        if (resumeJson.lesson_id != null) {
          // Resolve the UUID sidebar id by matching the DB integer lesson_id
          // across all lessons in all chapters.
          const targetDbId = resumeJson.lesson_id;
          outer: for (const chapter of planData.chapters ?? []) {
            for (const lesson of chapter.lessons ?? []) {
              if (lesson.lesson_id === targetDbId) {
                resumeLessonId = lesson.id;
                break outer;
              }
            }
          }
        }
      }
    } catch {
      // Resume endpoint unavailable — fall back to first lesson.
    }

    // ── 3. Transform chapters into StudyPageData ───────────────────────────────
    const allGroups:        StudyGroup[]                   = [];
    const allProgressItems: StudyProgressItem[]            = [];
    const allContentMap:    Record<string, StudyContent>   = {};
    const allLessonDbIdMap: Record<string, number>         = {};
    let   lessonCount = 0;

    const sortedChapters = [...(planData.chapters ?? [])].sort((a, b) => a.order - b.order);

    for (const chapter of sortedChapters) {
      const { group, progressItems, contentMap, lessonDbIdMap } = transformChapter(chapter);
      allGroups.push(group);
      allProgressItems.push(...progressItems);
      Object.assign(allContentMap, contentMap);
      Object.assign(allLessonDbIdMap, lessonDbIdMap);
      lessonCount += group.items.length;
    }

    return {
      courseTitle:    planData.course_title || "Course",
      lessonCount,
      totalMinutes:   0, // new study plan schema does not include time estimates
      groups:         allGroups,
      progressItems:  allProgressItems,
      contentMap:     allContentMap,
      lessonDbIdMap:  allLessonDbIdMap,
      resumeLessonId,
    };
  }
}
