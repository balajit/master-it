/**
 * contentNode.ts — Content item types for lesson body rendering.
 *
 * Re-exports the backend ContentItem discriminated union from the generated
 * v1.d.ts so the rest of the codebase has a single stable import point.
 *
 * Backend schema: Course → Chapter → Lesson → Page → ContentItem
 * Each item carries a `type` discriminator matching the backend literals:
 *   "text" | "heading" | "image" | "table" | "equation" | "code" | "list"
 */

import type { components } from "../api/v1.d.ts";

export type TextItem     = components["schemas"]["TextItem"];
export type HeadingItem  = components["schemas"]["HeadingItem"];
export type ImageItem    = components["schemas"]["ImageItem"];
export type TableItem    = components["schemas"]["TableItem"];
export type EquationItem = components["schemas"]["EquationItem"];
export type CodeItem     = components["schemas"]["CodeItem"];
export type ListItem     = components["schemas"]["ListItem"];

/** Discriminated union of all renderable content item types. */
export type ContentItem =
  | TextItem
  | HeadingItem
  | ImageItem
  | TableItem
  | EquationItem
  | CodeItem
  | ListItem;
