export type LessonStatus = "mastered" | "practiced" | "familiar" | "attempted" | "not_started";

export interface StatusMeta {
  label: string;
  color: string;
  cellClass: string;
}

export const STATUS_CONFIG: Record<LessonStatus, StatusMeta> = {
  mastered:    { label: "Mastered",    color: "bg-green-500",  cellClass: "bg-green-500" },
  practiced:   { label: "Practiced",   color: "bg-blue-500",   cellClass: "bg-blue-500" },
  familiar:    { label: "Familiar",    color: "bg-purple-500", cellClass: "bg-purple-500" },
  attempted:   { label: "Attempted",   color: "bg-amber-400",  cellClass: "bg-amber-400" },
  not_started: { label: "Not Started", color: "bg-gray-200",   cellClass: "bg-gray-200" },
};

export const STATUS_ALL_KEYS = Object.keys(STATUS_CONFIG) as LessonStatus[];
