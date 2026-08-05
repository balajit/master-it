/**
 * study.ts — Shared types and service interface for the study page.
 *
 * Both the mock service (studyMock.ts) and the real API service (studyApi.ts)
 * implement the StudyService interface and return StudyPageData.
 */

import type { LessonStatus } from "../components/study/statusConfig";
import type { ContentItem } from "../types/contentNode";

// ── Sidebar ──────────────────────────────────────────────────────────────────

export type ItemStatus = "completed" | "in_progress" | "not_started";

export interface StudyItem {
  id: string;
  label: string;
  status: ItemStatus;
  /** Badge text displayed on the right side of the sidebar item (e.g. "Quiz", "Project"). */
  meta?: string;
  /** Nested child items. The backend has no nested hierarchy — only mock data uses this. */
  children?: StudyItem[];
}

export interface StudyGroup {
  title: string;
  items: StudyItem[];
}

// ── Progress cells (ProgressCard) ─────────────────────────────────────────────

export interface StudyProgressItem {
  id: string;
  label: string;
  status: LessonStatus;
}

// ── Per-lesson content ────────────────────────────────────────────────────────

export interface LessonItemDef {
  title: string;
  description?: string;
  state: "completed" | "in_progress" | "not_started";
  duration?: string;
  /** Ordered content nodes for this lesson — populated from backend lesson body when available. */
  content?: ContentItem[];
}

export interface PracticeCardDef {
  title: string;
  description: string;
  progressLabel: string;
  badge: string;
  status: "not_started" | "in_progress" | "completed";
  actionLabel: string;
  disabled?: boolean;
}

export interface StudyContent {
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

export interface StudyDocumentData {
  documentId: string;
  documentName: string;
  groups: StudyGroup[];
  progressItems: StudyProgressItem[];
  contentMap: Record<string, StudyContent>;
  resumeLessonId: string | null;
}

// ── Top-level page data ───────────────────────────────────────────────────────

export interface StudyPageData {
  /** Course title shown in the sidebar header. */
  courseTitle: string;
  /** Total lesson count for the sidebar header. */
  lessonCount: number;
  /**
   * Total estimated minutes for the sidebar header.
   * Zero when the backend does not supply time estimates — sidebar hides the
   * time display in that case.
   */
  totalMinutes: number;
  /** Sidebar groups (one per milestone/section). */
  groups: StudyGroup[];
  /** All flattened items for the ProgressCard cells, keyed by item id. */
  progressItems: StudyProgressItem[];
  /** Per-item content for the main panel. */
  contentMap: Record<string, StudyContent>;
  /** Per-document study payloads for the study screen picker. */
  documents: StudyDocumentData[];
  /** Default selected document id for the screen. */
  selectedDocumentId: string | null;
  /**
   * The lesson id to open on page load (most recently accessed).
   * Null if the user has no progress — falls back to the first item in groups.
   *
   * TODO: populated from GET /api/v1/users/me/courses/{course_id}/resume
   * once backend Changes 10+11 are implemented and v1.d.ts is regenerated.
   */
  resumeLessonId: string | null;
}

// ── Service interface ─────────────────────────────────────────────────────────

export interface StudyService {
  getStudyPage(courseId: string): Promise<StudyPageData>;
}
