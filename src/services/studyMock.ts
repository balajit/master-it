import type {
  StudyService,
  StudyPageData,
  StudyGroup,
  StudyProgressItem,
  StudyContent,
  LessonItemDef,
} from "./study";
import type { ContentItem } from "../types/contentNode";
import type { LessonStatus } from "../components/study/statusConfig";

const MOCK_LESSON_ITEMS: ContentItem[] = [
  {
    id: "mock-h1", type: "heading", order: 0,
    content: "Section Heading", level: 2,
  },
  {
    id: "mock-t1", type: "text", order: 1,
    content: "This is a sample paragraph demonstrating lesson content rendering.",
    level: 0,
  },
  {
    id: "mock-eq1", type: "equation", order: 2,
    latex: "E = mc^2",
  },
  {
    id: "mock-l1", type: "list", order: 3,
    ordered: false,
    items: ["First key point", "Second key point", "Third key point"],
  },
];

const MOCK_GROUPS: StudyGroup[] = [
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

const MOCK_STATUSES: Record<string, LessonStatus> = {
  "lesson-1": "mastered",
  "lesson-2": "practiced",
  "lesson-3": "familiar",
  "lesson-4": "attempted",
  "lesson-5": "not_started",
  "lesson-6": "not_started",
  "lesson-7": "not_started",
};

function makeContent(id: string): StudyContent {
  return {
    info: {
      title: `About "${id}"`,
      body: `Lesson content for ${id}. This demonstrates the study page rendering pipeline.`,
    },
    learning: {
      title: "Lesson Content",
      estimatedTime: "",
      lessons: [
        { title: "Read the material", state: "completed" as const, content: MOCK_LESSON_ITEMS },
        { title: "Review key concepts", state: "in_progress" as const, content: MOCK_LESSON_ITEMS },
      ] as LessonItemDef[],
      practices: [
        { title: "Practice exercise", state: "not_started" as const, content: MOCK_LESSON_ITEMS },
      ] as LessonItemDef[],
    },
    goal: null,
    practiceCards: [],
  };
}

export class MockStudyService implements StudyService {
  async getStudyPage(courseId: string): Promise<StudyPageData> {
    const allIds = MOCK_GROUPS.flatMap((g) =>
      g.items.flatMap((i) => [i, ...(i.children ?? [])]),
    ).map((i) => i.id);

    const progressItems = allIds.map((id) => ({
      id,
      label: MOCK_GROUPS.flatMap((g) => g.items).find((i) => i.id === id)?.label ?? id,
      status: (MOCK_STATUSES[id] ?? "not_started") as StudyProgressItem["status"],
    }));

    const contentMap: Record<string, StudyContent> = {};
    for (const id of allIds) {
      contentMap[id] = makeContent(id);
    }

    return {
      courseTitle: `Sample Course ${courseId}`,
      lessonCount: allIds.length,
      totalMinutes: 0,
      groups: MOCK_GROUPS,
      progressItems,
      contentMap,
      lessonDbIdMap: {},
      resumeLessonId: allIds[0] ?? null,
    };
  }
}
