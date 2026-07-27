/**
 * studyApi.ts — Real API implementation of StudyService.
 *
 * Calls:
 *   GET /api/courses/{course_id}/study-plan  → CourseStudyPlanResponse (typed via v1.d.ts)
 *   GET /api/v1/users/me/courses/{course_id}/resume → ResumeResponse (inline type — TODO below)
 *
 * TODO: After the backend implements Changes 10+11 from STUDY_SCREEN_API_CHANGES.md,
 * regenerate v1.d.ts with:
 *   npx openapi-typescript http://localhost:5000/api/spec --output src/api/v1.d.ts
 * Then replace the plain fetch call below with a typed client.GET() call.
 *
 * Fields with no current backend equivalent are filled with "MOCK ..." text so they
 * are visually distinguishable in the UI while the backend catches up.
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
  PracticeCardDef,
} from "./study";
import type { components } from "../api/v1.d.ts";

type StudyPlanLesson     = components["schemas"]["StudyPlanLesson"];
type StudyPlanMilestone  = components["schemas"]["StudyPlanMilestone"];
type StudyPlanCheckpoint = components["schemas"]["StudyPlanCheckpoint"];
type StudyPlanDetail     = components["schemas"]["StudyPlanDetail"];

// ── Resume response type (inline until v1.d.ts is regenerated) ────────────────

/** @see STUDY_SCREEN_API_CHANGES.md Change 11 */
interface ResumeResponse {
  lesson_id: number | null;
  unit_id: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Map a StudyPlanLesson.lesson_type or checkpoint_type to a 3-state ItemStatus.
 * Until the backend exposes per-user progress on the study-plan endpoint,
 * we default everything to not_started.
 */
function defaultItemStatus(): ItemStatus {
  return "not_started";
}

/** Map checkpoint_type to a display badge string. */
function checkpointBadge(checkpointType: string): string {
  const map: Record<string, string> = {
    quiz:      "Quiz",
    practice:  "Practice",
    project:   "Project",
    self_test: "Self Test",
  };
  return map[checkpointType] ?? checkpointType;
}

/**
 * Build a lookup of lesson id → milestone id from the study plan lessons array,
 * so we can group lessons under the correct milestone.
 */
function buildLessonMilestoneMap(
  lessons: StudyPlanLesson[],
): Map<string, string | null> {
  const map = new Map<string, string | null>();
  for (const lesson of lessons) {
    map.set(lesson.id, lesson.milestone_id);
  }
  return map;
}

/**
 * Build a lookup of milestone id → sorted lessons.
 */
function buildMilestoneLessonsMap(
  lessons: StudyPlanLesson[],
): Map<string, StudyPlanLesson[]> {
  const map = new Map<string, StudyPlanLesson[]>();
  for (const lesson of lessons) {
    if (lesson.milestone_id) {
      const arr = map.get(lesson.milestone_id) ?? [];
      arr.push(lesson);
      map.set(lesson.milestone_id, arr);
    }
  }
  // Sort each milestone's lessons by order
  for (const arr of map.values()) {
    arr.sort((a, b) => a.order - b.order);
  }
  return map;
}

/**
 * Build a lookup of milestone id → sorted checkpoints.
 */
function buildMilestoneCheckpointsMap(
  checkpoints: StudyPlanCheckpoint[],
): Map<string, StudyPlanCheckpoint[]> {
  const map = new Map<string, StudyPlanCheckpoint[]>();
  for (const cp of checkpoints) {
    const arr = map.get(cp.milestone_id) ?? [];
    arr.push(cp);
    map.set(cp.milestone_id, arr);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => a.order - b.order);
  }
  return map;
}

/**
 * Convert a single StudyPlanDetail (one uploaded document's plan) into sidebar
 * groups, progress items, and a content map.
 */
function transformPlanDetail(detail: StudyPlanDetail): {
  groups: StudyGroup[];
  progressItems: StudyProgressItem[];
  contentMap: Record<string, StudyContent>;
  totalMinutes: number;
  lessonCount: number;
} {
  const milestoneMap = buildMilestoneLessonsMap(detail.lessons);
  const checkpointMap = buildMilestoneCheckpointsMap(detail.checkpoints);

  const groups: StudyGroup[] = [];
  const progressItems: StudyProgressItem[] = [];
  const contentMap: Record<string, StudyContent> = {};

  const sortedMilestones = [...detail.milestones].sort((a, b) => a.order - b.order);

  for (const milestone of sortedMilestones) {
    const lessons    = milestoneMap.get(milestone.id) ?? [];
    const checkpoints = checkpointMap.get(milestone.id) ?? [];

    const sidebarItems: StudyItem[] = [];

    // Lessons
    for (const lesson of lessons) {
      const itemId = lesson.id;
      const status = defaultItemStatus();

      sidebarItems.push({ id: itemId, label: lesson.title, status });

      // Progress cell
      progressItems.push({ id: itemId, label: lesson.title, status: "not_started" });

      // Content — info and learning populated from study plan fields.
      // Goal and practiceCards have no backend source yet → MOCK text.
      const lessonItems: LessonItemDef[] = [
        {
          title: lesson.title,
          description: lesson.description || undefined,
          state: "not_started",
          duration: lesson.estimated_minutes > 0 ? `${lesson.estimated_minutes} min` : undefined,
        },
      ];

      contentMap[itemId] = {
        info: {
          title: lesson.title,
          body: lesson.description
            ? lesson.description
            : `MOCK No description available for "${lesson.title}".`,
        },
        learning: {
          title: lesson.title,
          estimatedTime: lesson.estimated_minutes > 0
            ? `~${lesson.estimated_minutes} min`
            : "",
          lessons: lessonItems,
          practices: [], // MOCK — practice items not in study plan response
        },
        goal: {
          title: "MOCK Keep going!",
          description: `MOCK Complete "${lesson.title}" to unlock the next section.`,
          actionLabel: "MOCK Continue",
        },
        practiceCards: [], // MOCK — no practice card data in study plan
      };
    }

    // Checkpoints
    for (const cp of checkpoints) {
      const itemId = cp.id;
      const badge  = checkpointBadge(cp.checkpoint_type);
      const status = defaultItemStatus();

      sidebarItems.push({ id: itemId, label: cp.title, status, meta: badge });

      progressItems.push({ id: itemId, label: cp.title, status: "not_started" });

      const practiceCard: PracticeCardDef = {
        title: cp.title,
        description: `MOCK ${badge} — complete this checkpoint to advance.`,
        progressLabel: `MOCK Score required to pass`,
        badge,
        status: "not_started",
        actionLabel: "MOCK Start",
      };

      contentMap[itemId] = {
        info: {
          title: `MOCK About this checkpoint`,
          body: `MOCK This ${badge.toLowerCase()} covers the material from the milestone. Complete it to move forward.`,
        },
        learning: null,
        goal: null,
        practiceCards: [practiceCard],
      };
    }

    groups.push({ title: milestone.title, items: sidebarItems });
  }

  return {
    groups,
    progressItems,
    contentMap,
    totalMinutes: detail.total_estimated_minutes,
    lessonCount: detail.total_lessons,
  };
}

// ── API Service ───────────────────────────────────────────────────────────────

export class ApiStudyService implements StudyService {
  async getStudyPage(courseId: string): Promise<StudyPageData> {
    const courseIdNum = Number(courseId);

    // ── 1. Fetch study plan (typed via openapi-fetch) ─────────────────────────
    const { data: planData, error: planError } = await client.GET(
      "/api/courses/{course_id}/study-plan",
      { params: { path: { course_id: courseIdNum } } },
    );

    if (planError || !planData) {
      throw new Error(`Failed to load study plan: ${JSON.stringify(planError)}`);
    }

    // ── 2. Fetch resume lesson (plain fetch — not yet in v1.d.ts) ─────────────
    // TODO: replace with typed client.GET() after regenerating v1.d.ts
    // following backend Changes 10+11 in STUDY_SCREEN_API_CHANGES.md.
    let resumeLessonId: string | null = null;
    try {
      const token = localStorage.getItem("master_it_auth");
      const resumeRes = await fetch(
        `http://localhost:5000/api/v1/users/me/courses/${courseIdNum}/resume`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      if (resumeRes.ok) {
        const resumeJson = (await resumeRes.json()) as ResumeResponse;
        if (resumeJson.lesson_id != null) {
          resumeLessonId = String(resumeJson.lesson_id);
        }
      }
    } catch {
      // Resume endpoint not yet implemented — silently fall back to first lesson.
    }

    // ── 3. Transform study plan into StudyPageData ────────────────────────────
    // Use the first study plan detail (one per uploaded document). If a course
    // has multiple documents, merge their groups and content maps.
    const allGroups:        StudyGroup[]                    = [];
    const allProgressItems: StudyProgressItem[]             = [];
    const allContentMap:    Record<string, StudyContent>    = {};
    let   totalMinutes = 0;
    let   lessonCount  = 0;

    for (const detail of planData.study_plans) {
      const transformed = transformPlanDetail(detail);
      allGroups.push(...transformed.groups);
      allProgressItems.push(...transformed.progressItems);
      Object.assign(allContentMap, transformed.contentMap);
      totalMinutes += transformed.totalMinutes;
      lessonCount  += transformed.lessonCount;
    }

    return {
      courseTitle:   planData.course_title || "Course",
      lessonCount,
      totalMinutes,
      groups:        allGroups,
      progressItems: allProgressItems,
      contentMap:    allContentMap,
      resumeLessonId,
    };
  }
}
