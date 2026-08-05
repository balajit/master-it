import client from "../api/client";
import type {
  StudyService,
  StudyPageData,
  StudyDocumentData,
  StudyGroup,
  StudyItem,
  StudyProgressItem,
  StudyContent,
} from "./study";
import type { components } from "../api/v1.d.ts";
import type { ContentItem, RichTextRun } from "../types/contentNode";

type Chapter = components["schemas"]["Chapter"];
type Lesson  = components["schemas"]["Lesson"];
type Page = components["schemas"]["Page"];
type ApiContentItem = NonNullable<Page["items"]>[number];
type TextRunMetadata = components["schemas"]["TextRunMetadata"];

interface PlanDocumentNode {
  document_id: string;
  document_name: string;
  chapters: Chapter[];
}

interface TransformedStudyData {
  groups: StudyGroup[];
  progressItems: StudyProgressItem[];
  contentMap: Record<string, StudyContent>;
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function mapTextRuns(runs?: TextRunMetadata[]): RichTextRun[] | undefined {
  if (!Array.isArray(runs) || runs.length === 0) return undefined;
  return runs.map((run) => ({
    text: typeof run.text === "string" ? run.text : "",
    linkTarget: run.link_target || undefined,
    isBold: !!run.style?.font?.is_bold,
    isItalic: !!run.style?.font?.is_italic,
    isUnderline: !!run.style?.font?.is_underline,
    isStrikethrough: !!run.style?.font?.is_strikethrough,
  }));
}

function mapNodeRuns(
  runs?: (
    | components["schemas"]["PlainRun"]
    | components["schemas"]["EqRun"]
    | components["schemas"]["BoldRun"]
    | components["schemas"]["ItalicRun"]
    | components["schemas"]["CodeRun"]
    | components["schemas"]["LinkRun"]
  )[],
): RichTextRun[] | undefined {
  if (!Array.isArray(runs) || runs.length === 0) return undefined;

  return runs.map((run) => {
    if (run.run_type === "link") {
      return {
        text: run.text ?? "",
        linkTarget: run.href ?? undefined,
        isBold: false,
        isItalic: false,
        isUnderline: false,
        isStrikethrough: false,
      };
    }

    if (run.run_type === "eq") {
      return {
        text: run.latex ? `$${run.latex}$` : "",
        linkTarget: undefined,
        isBold: false,
        isItalic: false,
        isUnderline: false,
        isStrikethrough: false,
      };
    }

    return {
      text: run.text ?? "",
      linkTarget: undefined,
      isBold: run.run_type === "bold",
      isItalic: run.run_type === "italic",
      isUnderline: false,
      isStrikethrough: false,
    };
  });
}

function mapFormAreaItems(rawItems: unknown): {
  items: string[];
  itemTextRuns?: (RichTextRun[] | undefined)[];
} {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { items: [] };
  }

  const items: string[] = [];
  const itemTextRuns: (RichTextRun[] | undefined)[] = [];

  for (const entry of rawItems) {
    if (typeof entry === "string") {
      items.push(entry);
      itemTextRuns.push(undefined);
      continue;
    }

    if (!entry || typeof entry !== "object") continue;

    const maybeTextItem = entry as {
      type?: unknown;
      text?: unknown;
      runs?: (
        | components["schemas"]["PlainRun"]
        | components["schemas"]["EqRun"]
        | components["schemas"]["BoldRun"]
        | components["schemas"]["ItalicRun"]
        | components["schemas"]["CodeRun"]
        | components["schemas"]["LinkRun"]
      )[];
    };

    if (typeof maybeTextItem.text === "string") {
      items.push(maybeTextItem.text);
      itemTextRuns.push(undefined);
      continue;
    }

    if (maybeTextItem.type === "text_item") {
      const runs = mapNodeRuns(maybeTextItem.runs);
      const text = runs?.map((run) => run.text).join("") ?? "";
      items.push(text);
      itemTextRuns.push(runs);
    }
  }

  if (itemTextRuns.some((runs) => Array.isArray(runs) && runs.length > 0)) {
    return { items, itemTextRuns };
  }

  return { items };
}

function mapBlockStyle(style?: components["schemas"]["BlockStyleMetadata"] | null) {
  if (!style) return undefined;
  return {
    alignment: style.alignment || undefined,
    indentLevel: toNumber(style.indent_level, 0),
  };
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
        textRuns: mapTextRuns(item.metadata?.text_runs),
        level: toNumber(item.level, 0),
        blockStyle: mapBlockStyle(item.style),
        semanticType: item.metadata?.semantic_type ?? null,
        checkboxState: item.metadata?.checkbox_state ?? null,
        numberedItem: item.metadata?.numbered_item ?? null,
        hasFillInBlanks: item.metadata?.has_fill_in_blanks ?? null,
        fillInBlankIds: item.metadata?.fill_in_blank_ids ?? [],
        blankSpanPositions: item.metadata?.blank_span_positions ?? [],
      };
    case "form_area":
      {
      const { items, itemTextRuns } = mapFormAreaItems(item.items);
      return {
        type: "form_area",
        id,
        order,
        items,
        itemTextRuns,
        displayHint: item.metadata?.display_hint ?? null,
        blockStyle: mapBlockStyle(item.style),
      };
    }
    case "heading":
      return {
        type: "heading",
        id,
        order,
        content: typeof item.content === "string" ? item.content : "",
        textRuns: mapTextRuns(item.metadata?.text_runs),
        level: toNumber(item.level, 1),
        blockStyle: mapBlockStyle(item.style),
        headingNumber: item.metadata?.number ?? null,
      };
    case "equation":
      return {
        type: "equation",
        id,
        order,
        latex: typeof item.latex === "string" ? item.latex : "",
        label: item.label ?? null,
        isBlock: item.metadata?.is_block ?? null,
        hasMathml: item.metadata?.has_mathml ?? null,
      };
    case "code":
      return {
        type: "code",
        id,
        order,
        content: typeof item.content === "string" ? item.content : "",
        language: item.language ?? null,
        filename: item.metadata?.filename ?? null,
        lineStart: item.metadata?.line_start ?? null,
      };
    case "image":
      return {
        type: "image",
        id,
        order,
        data: typeof item.data === "string" ? item.data : "",
        imageUrl: item.metadata?.image_uri || undefined,
        altText: item.metadata?.alt_text || undefined,
        caption: item.caption ?? item.metadata?.caption_text ?? null,
        mimeType: item.metadata?.mimetype ?? null,
        width: item.metadata?.width ?? null,
        height: item.metadata?.height ?? null,
      };
    case "table":
      return {
        type: "table",
        id,
        order,
        caption: item.caption ?? null,
        headers: Array.isArray(item.headers) ? item.headers : [],
        rows: Array.isArray(item.rows)
          ? item.rows.map((row: unknown) => (Array.isArray(row) ? row : []))
          : [],
        blockStyle: mapBlockStyle(item.style),
        rowCount: item.metadata?.row_count ?? null,
        columnCount: item.metadata?.column_count ?? null,
      };
    case "list":
      return {
        type: "list",
        id,
        order,
        ordered: !!item.ordered,
        items: Array.isArray(item.items) ? item.items : [],
        itemTextRuns: Array.isArray(item.metadata?.item_text_runs)
          ? item.metadata.item_text_runs.map((runs: TextRunMetadata[] | undefined) => mapTextRuns(runs) ?? [])
          : undefined,
        blockStyle: mapBlockStyle(item.style),
        listStyle: item.metadata?.list_style ?? null,
      };
    case "question":
      return {
        type: "question",
        id,
        order,
        questionType: item.question_type ?? "unknown",
        content: typeof item.content === "string" ? item.content : "",
        options: Array.isArray(item.options)
          ? item.options.map((opt) => ({
              label: opt.label ?? "",
              text: opt.text ?? "",
              isCorrect: opt.is_correct ?? null,
              explanation: opt.explanation ?? "",
            }))
          : [],
        blanks: Array.isArray(item.blanks)
          ? item.blanks.map((blank) => ({
              blankId: toNumber(blank.blank_id, 0),
              answer: blank.answer ?? "",
            }))
          : [],
        statements: Array.isArray(item.statements)
          ? item.statements.map((statement) => ({
              number: statement.number ?? null,
              text: statement.text ?? "",
              expectedAnswer: statement.expected_answer ?? null,
            }))
          : [],
        solution: item.solution ?? "",
        explanation: item.explanation ?? "",
        points: toNumber(item.points, 0),
        blockStyle: mapBlockStyle(item.style),
        numberedItem: item.metadata?.numbered_item ?? null,
        hasFillInBlanks: item.metadata?.has_fill_in_blanks ?? null,
        fillInBlankIds: item.metadata?.fill_in_blank_ids ?? [],
        blankSpanPositions: item.metadata?.blank_span_positions ?? [],
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

    const sourceDocuments: PlanDocumentNode[] = Array.isArray((planData as { documents?: unknown }).documents)
      ? ((planData as { documents?: PlanDocumentNode[] }).documents ?? [])
      : [];

    const documents: StudyDocumentData[] = sourceDocuments.map((doc, index) => {
      const transformed = this._transformChapters(doc.chapters ?? []);
      return {
        documentId: doc.document_id || `document-${index + 1}`,
        documentName: doc.document_name || `Document ${index + 1}`,
        ...transformed,
        resumeLessonId: null,
      };
    });

    if (documents.length === 0) {
      const transformed = this._transformChapters(planData.chapters ?? []);
      documents.push({
        documentId: "default",
        documentName: "All Documents",
        ...transformed,
        resumeLessonId: null,
      });
    }

    // TODO: populate resumeLessonId once the resume endpoint returns a lesson UUID.

    const selectedDocument = documents.find((doc) => doc.progressItems.length > 0) ?? documents[0] ?? null;
    const selectedDocumentId = selectedDocument?.documentId ?? null;

    return {
      courseTitle:   planData.course_title || "Course",
      lessonCount:   selectedDocument?.progressItems.length ?? 0,
      totalMinutes:  0,
      groups:        selectedDocument?.groups ?? [],
      progressItems: selectedDocument?.progressItems ?? [],
      contentMap:    selectedDocument?.contentMap ?? {},
      resumeLessonId: selectedDocument?.resumeLessonId ?? null,
      documents,
      selectedDocumentId,
    };
  }

  private _transformChapters(chapters: Chapter[]): TransformedStudyData {
    const allGroups: StudyGroup[] = [];
    const allProgressItems: StudyProgressItem[] = [];
    const allContentMap: Record<string, StudyContent> = {};

    const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
    for (const chapter of sortedChapters) {
      const { group, progressItems, contentMap } = this._transformChapter(chapter);
      allGroups.push(group);
      allProgressItems.push(...progressItems);
      Object.assign(allContentMap, contentMap);
    }

    return {
      groups: allGroups,
      progressItems: allProgressItems,
      contentMap: allContentMap,
    };
  }

  private _transformChapter(chapter: Chapter): {
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
