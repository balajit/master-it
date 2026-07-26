import { useState } from "react";
import { StatusDot } from "./ui";

type LessonState = "completed" | "in_progress" | "not_started";

interface LessonItemProps {
  title: string;
  description?: string;
  state?: LessonState;
  duration?: string;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  content?: React.ReactNode;
}

const ROW_STYLES: Record<LessonState, string> = {
  completed: "border-green-100 bg-green-50/50 hover:bg-green-50",
  in_progress: "border-blue-200 bg-blue-50/50 hover:bg-blue-50",
  not_started: "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50",
};

const TITLE_STYLES: Record<LessonState, string> = {
  completed: "text-gray-500 line-through",
  in_progress: "text-gray-900",
  not_started: "text-gray-900",
};

function CompletionIndicator({ state }: { state: LessonState }) {
  if (state === "completed") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 text-white">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
        </svg>
      </span>
    );
  }

  if (state === "in_progress") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-blue-500 bg-white">
        <span className="h-2 w-2 rounded-full bg-blue-500" />
      </span>
    );
  }

  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 bg-white" />
  );
}

export default function LessonItem({
  title,
  description,
  state = "not_started",
  duration,
  onClick,
  className = "",
  icon,
  content,
}: LessonItemProps) {
  const [expanded, setExpanded] = useState(false);
  const hasContent = content != null;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => {
          if (hasContent) {
            setExpanded(!expanded);
          } else {
            onClick?.();
          }
        }}
        className={`group flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all ${ROW_STYLES[state]} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`}
      >
        <CompletionIndicator state={state} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {icon && <span className="shrink-0 text-gray-400 group-hover:text-gray-600">{icon}</span>}
            <span className={`text-sm font-medium ${TITLE_STYLES[state]}`}>{title}</span>
          </div>
          {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {duration && <span className="text-xs text-gray-400">{duration}</span>}
          {hasContent && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`}
            >
              <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </button>

      {hasContent && expanded && (
        <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50/50 px-5 py-4">
          {content}
        </div>
      )}
    </div>
  );
}
