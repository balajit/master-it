import client, { getAuthToken } from "../api/client";
import type {
  StudyService,
  StudyPageData,
  StudyGroup,
  StudyItem,
  StudyProgressItem,
  StudyContent,
} from "./study";
import type { components } from "../api/v1.d.ts";

type StudyPlanDetail  = components["schemas"]["StudyPlanDetail"];
type StudyPlanLesson  = components["schemas"]["StudyPlanLesson"];


interface ResumeResponse {
  lesson_id: string | null;
  unit_id:   string | null;
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

    let resumeLessonId: string | null = null;
    try {
      const token = getAuthToken();
      const resumeRes = await fetch(
        `http://localhost:5000/api/v1/users/me/courses/${courseIdNum}/resume`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      if (resumeRes.ok) {
        const resumeJson = (await resumeRes.json()) as ResumeResponse;
        if (resumeJson.lesson_id != null) {
          resumeLessonId = resumeJson.lesson_id;
        }
      }
    } catch {
      // Resume endpoint unavailable — fall back to first lesson.
    }

    const allGroups:        StudyGroup[]                = [];
    const allProgressItems: StudyProgressItem[]         = [];
    const allContentMap:    Record<string, StudyContent> = {};
    let lessonCount = 0;

    for (const sp of planData.study_plans ?? []) {
      const { groups, progressItems } = this._transformStudyPlan(sp);
      allGroups.push(...groups);
      allProgressItems.push(...progressItems);
      lessonCount += progressItems.length;
    }

    return {
      courseTitle:   planData.course_title || "Course",
      lessonCount,
      totalMinutes:  0,
      groups:        allGroups,
      progressItems: allProgressItems,
      contentMap:    allContentMap,
      lessonDbIdMap: {},
      resumeLessonId,
    };
  }

  private _transformStudyPlan(sp: StudyPlanDetail): {
    groups: StudyGroup[];
    progressItems: StudyProgressItem[];
  } {
    const progressItems: StudyProgressItem[] = [];
    const milestones = [...(sp.milestones ?? [])].sort((a, b) => a.order - b.order);
    const lessons = [...(sp.lessons ?? [])].sort((a, b) => a.order - b.order);

    const groupedLessons = new Map<string, StudyPlanLesson[]>();
    const ungrouped: StudyPlanLesson[] = [];

    for (const lesson of lessons) {
      if (lesson.milestone_id) {
        const existing = groupedLessons.get(lesson.milestone_id) ?? [];
        existing.push(lesson);
        groupedLessons.set(lesson.milestone_id, existing);
      } else {
        ungrouped.push(lesson);
      }
    }

    const groups: StudyGroup[] = [];

    for (const milestone of milestones) {
      const msLessons = groupedLessons.get(milestone.id) ?? [];
      const items: StudyItem[] = msLessons.map((l) => {
        progressItems.push({
          id: l.id,
          label: l.title || "Untitled Lesson",
          status: "not_started",
        });
        return { id: l.id, label: l.title || "Untitled Lesson", status: "not_started" as const };
      });
      groups.push({
        title: milestone.title || "Untitled Milestone",
        items,
      });
    }

    if (ungrouped.length > 0) {
      const items: StudyItem[] = ungrouped.map((l) => {
        progressItems.push({
          id: l.id,
          label: l.title || "Untitled Lesson",
          status: "not_started",
        });
        return { id: l.id, label: l.title || "Untitled Lesson", status: "not_started" as const };
      });
      groups.push({
        title: sp.title || "Lessons",
        items,
      });
    }

    return { groups, progressItems };
  }
}
