import client from "../api/client";
import type {
  StudyService,
  StudyPageData,
  StudyGroup,
  StudyItem,
  StudyProgressItem,
  StudyContent,
} from "./study";
import type { components } from "../api/v1.d.ts";
import type { ContentItem } from "../types/contentNode";

type Chapter = components["schemas"]["Chapter"];
type Lesson  = components["schemas"]["Lesson"];
type Page = components["schemas"]["Page"];
type ApiContentItem = Page["items"][number];

function toNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function mapApiItem(item: ApiContentItem): ContentItem | null {
  if (!item || typeof item !== "object") return null;

  const id = typeof item.id === "string" ? item.id : crypto.randomUUID();
  const order = toNumber(item.order, 0);

  switch (item.type) {
    case "text":
      return {
        type: "text",
        id,
        order,
        content: typeof item.content === "string" ? item.content : "",
        level: toNumber(item.level, 0),
      };
    case "heading":
      return {
        type: "heading",
        id,
        order,
        content: typeof item.content === "string" ? item.content : "",
        level: toNumber(item.level, 1),
      };
    case "equation":
      return {
        type: "equation",
        id,
        order,
        latex: typeof item.latex === "string" ? item.latex : "",
        label: item.label ?? null,
      };
    case "code":
      return {
        type: "code",
        id,
        order,
        content: typeof item.content === "string" ? item.content : "",
        language: item.language ?? null,
      };
    case "image":
      return {
        type: "image",
        id,
        order,
        data: typeof item.data === "string" ? item.data : "",
        caption: item.caption ?? null,
      };
    case "table":
      return {
        type: "table",
        id,
        order,
        caption: item.caption ?? null,
        headers: Array.isArray(item.headers) ? item.headers : [],
        rows: Array.isArray(item.rows)
          ? item.rows.map((row) => (Array.isArray(row) ? row : []))
          : [],
      };
    case "list":
      return {
        type: "list",
        id,
        order,
        ordered: !!item.ordered,
        items: Array.isArray(item.items) ? item.items : [],
      };
    default:
      return null;
  }
}

function extractLessonContentItems(pages: Page[]): ContentItem[] {
  const sortedPages = [...pages].sort((a, b) => a.order - b.order);
  const contentItems: ContentItem[] = [];

  for (const page of sortedPages) {
    const pageItems = [...(page.items ?? [])].sort((a, b) => a.order - b.order);
    for (const apiItem of pageItems) {
      const mapped = mapApiItem(apiItem);
      if (mapped) contentItems.push(mapped);
    }
  }

  return contentItems;
}

export class ApiStudyService implements StudyService {
  async getStudyPage(courseId: string): Promise<StudyPageData> {
    const courseIdNum = Number(courseId);

    const { data: planData, error: planError } = await client.GET(
      "/api/courses/{course_id}/study-plan",
      { params: { path: { course_id: courseIdNum } } },
    );

    if (planError || !planData) {
      throw new Error(`Failed to load study plan: ${JSON.stringify(planError)}`);
    }

    const allGroups:        StudyGroup[]                 = [];
    const allProgressItems: StudyProgressItem[]          = [];
    const allContentMap:    Record<string, StudyContent> = {};
    const lessonDbIdMap:    Record<string, number>       = {};

    const chapters = [...(planData.chapters ?? [])].sort((a, b) => a.order - b.order);

    for (const chapter of chapters) {
      const { group, progressItems, contentMap } = this._transformChapter(
        chapter,
        lessonDbIdMap,
      );
      allGroups.push(group);
      allProgressItems.push(...progressItems);
      Object.assign(allContentMap, contentMap);
    }

    let resumeLessonId: string | null = null;
    const { data: resumeData, error: resumeError } = await client.GET(
      "/api/v1/users/me/courses/{course_id}/resume",
      { params: { path: { course_id: courseIdNum } } },
    );

    if (!resumeError && resumeData?.lesson_id != null) {
      const matchedLesson = Object.entries(lessonDbIdMap).find(
        ([, dbId]) => dbId === resumeData.lesson_id,
      );
      resumeLessonId = matchedLesson?.[0] ?? null;
    }

    return {
      courseTitle:   planData.course_title || "Course",
      lessonCount:   allProgressItems.length,
      totalMinutes:  0,
      groups:        allGroups,
      progressItems: allProgressItems,
      contentMap:    allContentMap,
      lessonDbIdMap,
      resumeLessonId,
    };
  }

  private _transformChapter(
    chapter: Chapter,
    lessonDbIdMap: Record<string, number>,
  ): {
    group: StudyGroup;
    progressItems: StudyProgressItem[];
    contentMap: Record<string, StudyContent>;
  } {
    const progressItems: StudyProgressItem[] = [];
    const contentMap: Record<string, StudyContent> = {};
    const lessons = [...(chapter.lessons ?? [])].sort((a, b) => a.order - b.order);

    const items: StudyItem[] = lessons.map((lesson: Lesson) => {
      progressItems.push({
        id:     lesson.id,
        label:  lesson.title || "Untitled Lesson",
        status: "not_started",
      });
      if (lesson.lesson_id != null) {
        lessonDbIdMap[lesson.id] = lesson.lesson_id;
      }

      const contentItems = extractLessonContentItems(lesson.pages ?? []);
      contentMap[lesson.id] = {
        info: {
          title: lesson.title || "Untitled Lesson",
          body: `${lesson.pages.length} page${lesson.pages.length === 1 ? "" : "s"} of learning content`,
        },
        learning: {
          title: "Lesson Content",
          estimatedTime: "",
          lessons: [
            {
              title: lesson.title || "Untitled Lesson",
              state: "not_started",
              content: contentItems,
            },
          ],
          practices: [],
        },
        goal: null,
        practiceCards: [],
      };

      return { id: lesson.id, label: lesson.title || "Untitled Lesson", status: "not_started" as const };
    });

    return {
      group: {
        title: chapter.title || "Untitled Chapter",
        items,
      },
      progressItems,
      contentMap,
    };
  }
}
