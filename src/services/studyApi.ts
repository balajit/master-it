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

type Chapter = components["schemas"]["Chapter"];
type Lesson  = components["schemas"]["Lesson"];

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
      const { group, progressItems } = this._transformChapter(chapter, lessonDbIdMap);
      allGroups.push(group);
      allProgressItems.push(...progressItems);
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
  ): { group: StudyGroup; progressItems: StudyProgressItem[] } {
    const progressItems: StudyProgressItem[] = [];
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
      return { id: lesson.id, label: lesson.title || "Untitled Lesson", status: "not_started" as const };
    });

    return {
      group: {
        title: chapter.title || "Untitled Chapter",
        items,
      },
      progressItems,
    };
  }
}
