/**
 * contentNode.ts — Frontend type definitions for lesson body content nodes.
 *
 * This discriminated union mirrors the backend `ContentNode` Pydantic schema
 * defined in CONTENT_NODE_SPEC.md. Every type here has a 1:1 counterpart in
 * the backend API response.
 *
 * Rendering responsibility:
 *   - Plain text runs     → styled <span> / <p>
 *   - EqRun / EquationNode → KaTeX (react-katex InlineMath / BlockMath)
 *   - CodeBlockNode       → <pre><code> with optional syntax highlighting
 *   - TableNode           → <table> with Tailwind styling
 *   - NoteNode            → color-coded aside by variant
 *   - CalloutNode         → color-coded callout box by variant
 *   - DefinitionNode      → term + definition pair
 *   - FigureNode          → <img> with caption
 */

// ── Inline run types ──────────────────────────────────────────────────────────

export interface PlainRun {
  run_type: "text";
  text: string;
}

export interface EqRun {
  /** Inline LaTeX equation embedded mid-sentence. Rendered with KaTeX InlineMath. */
  run_type: "eq";
  latex: string;
}

export interface BoldRun {
  run_type: "bold";
  text: string;
}

export interface ItalicRun {
  run_type: "italic";
  text: string;
}

export interface CodeRun {
  run_type: "code";
  text: string;
}

export interface LinkRun {
  run_type: "link";
  text: string;
  href: string;
}

export type InlineRun = PlainRun | EqRun | BoldRun | ItalicRun | CodeRun | LinkRun;

// ── Content node types ────────────────────────────────────────────────────────

export interface HeadingNode {
  type: "heading";
  /** 1 = chapter, 2 = section, 3 = subsection, 4 = sub-subsection */
  level: 1 | 2 | 3 | 4;
  /** Section number extracted from source document, e.g. "3.2" */
  number?: string;
  text: string;
}

export interface ParagraphNode {
  type: "paragraph";
  /**
   * Ordered inline runs. A sentence with an inline equation is expressed as:
   *   [PlainRun, EqRun, PlainRun]
   * Plain paragraphs have a single PlainRun.
   */
  runs: InlineRun[];
}

export interface ListItemNode {
  runs: InlineRun[];
}

export interface ListNode {
  type: "list";
  style: "bullet" | "numbered" | "alpha" | "roman" | "checkbox";
  items: ListItemNode[];
}

export interface EquationNode {
  /** Block (display) LaTeX equation. Rendered with KaTeX BlockMath. */
  type: "equation";
  latex: string;
  /** Equation number/label from source document, e.g. "(3.2)". Empty string if absent. */
  label?: string;
}

export interface CodeBlockNode {
  type: "code_block";
  language: string;
  code: string;
}

export interface TableCellNode {
  header: boolean;
  text: string;
  col_span: number;
  row_span: number;
}

export interface TableRowNode {
  cells: TableCellNode[];
  is_header: boolean;
}

export interface TableNode {
  type: "table";
  caption?: string;
  rows: TableRowNode[];
}

export interface NoteNode {
  type: "note";
  variant: "info" | "tip" | "warning" | "danger";
  runs: InlineRun[];
}

export interface CalloutNode {
  type: "callout";
  variant: "example" | "non_example" | "reminder";
  title?: string;
  runs: InlineRun[];
}

export interface DefinitionNode {
  type: "definition";
  term: string;
  definition: string;
}

export interface FigureNode {
  type: "figure";
  image_url?: string;
  alt_text?: string;
  caption?: string;
}

// ── Discriminated union ───────────────────────────────────────────────────────

export type ContentNode =
  | HeadingNode
  | ParagraphNode
  | ListNode
  | EquationNode
  | CodeBlockNode
  | TableNode
  | NoteNode
  | CalloutNode
  | DefinitionNode
  | FigureNode;
