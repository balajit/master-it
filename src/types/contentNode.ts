export interface TextItem {
  type: "text";
  id: string;
  order: number;
  content: string;
  level: number;
}

export interface HeadingItem {
  type: "heading";
  id: string;
  order: number;
  content: string;
  level: number;
}

export interface EquationItem {
  type: "equation";
  id: string;
  order: number;
  latex: string;
  label?: string | null;
}

export interface CodeItem {
  type: "code";
  id: string;
  order: number;
  content: string;
  language?: string | null;
}

export interface ImageItem {
  type: "image";
  id: string;
  order: number;
  data: string;
  caption?: string | null;
}

export interface TableItem {
  type: "table";
  id: string;
  order: number;
  caption?: string | null;
  headers: string[];
  rows: string[][];
}

export interface ListItem {
  type: "list";
  id: string;
  order: number;
  ordered: boolean;
  items: string[];
}

export type ContentItem =
  | TextItem
  | HeadingItem
  | ImageItem
  | TableItem
  | EquationItem
  | CodeItem
  | ListItem;
