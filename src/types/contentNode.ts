export interface RichTextRun {
  text: string;
  linkTarget?: string | null;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  isStrikethrough?: boolean;
}

export interface ItemBlockStyle {
  alignment?: string | null;
  indentLevel?: number;
}

export interface TextItem {
  type: "text";
  id: string;
  order: number;
  content: string;
  textRuns?: RichTextRun[];
  level: number;
  blockStyle?: ItemBlockStyle;
  semanticType?: string | null;
  checkboxState?: string | null;
  numberedItem?: number | null;
  hasFillInBlanks?: boolean | null;
  fillInBlankIds?: number[];
  blankSpanPositions?: number[];
}

export interface FormAreaItem {
  type: "form_area";
  id: string;
  order: number;
  items: string[];
  itemTextRuns?: (RichTextRun[] | undefined)[];
  displayHint?: string | null;
  blockStyle?: ItemBlockStyle;
}

export interface TextItemNodeItem {
  type: "text_item";
  id: string;
  order: number;
  content: string;
  textRuns?: RichTextRun[];
  blockStyle?: ItemBlockStyle;
}

export interface HeadingItem {
  type: "heading";
  id: string;
  order: number;
  content: string;
  textRuns?: RichTextRun[];
  level: number;
  blockStyle?: ItemBlockStyle;
  headingNumber?: string | null;
}

export interface EquationItem {
  type: "equation";
  id: string;
  order: number;
  latex: string;
  label?: string | null;
  isBlock?: boolean | null;
  hasMathml?: boolean | null;
}

export interface CodeItem {
  type: "code";
  id: string;
  order: number;
  content: string;
  language?: string | null;
  filename?: string | null;
  lineStart?: number | null;
}

export interface ImageItem {
  type: "image";
  id: string;
  order: number;
  data: string;
  imageUrl?: string;
  altText?: string;
  caption?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface TableItem {
  type: "table";
  id: string;
  order: number;
  caption?: string | null;
  headers: string[];
  rows: string[][];
  blockStyle?: ItemBlockStyle;
  rowCount?: number | null;
  columnCount?: number | null;
}

export interface ListItem {
  type: "list";
  id: string;
  order: number;
  ordered: boolean;
  items: string[];
  itemTextRuns?: RichTextRun[][];
  blockStyle?: ItemBlockStyle;
  listStyle?: string | null;
}

export interface QuestionOption {
  label: string;
  text: string;
  isCorrect?: boolean | null;
  explanation?: string;
}

export interface QuestionBlank {
  blankId: number;
  answer: string;
}

export interface QuestionStatement {
  number?: number | null;
  text: string;
  expectedAnswer?: boolean | null;
}

export interface QuestionItem {
  type: "question";
  id: string;
  order: number;
  questionType: string;
  content: string;
  options: QuestionOption[];
  blanks: QuestionBlank[];
  statements: QuestionStatement[];
  solution: string;
  explanation: string;
  points: number;
  blockStyle?: ItemBlockStyle;
  numberedItem?: number | null;
  hasFillInBlanks?: boolean | null;
  fillInBlankIds?: number[];
  blankSpanPositions?: number[];
}

export type ContentItem =
  | TextItem
  | TextItemNodeItem
  | HeadingItem
  | ImageItem
  | TableItem
  | EquationItem
  | CodeItem
  | ListItem
  | FormAreaItem
  | QuestionItem;
