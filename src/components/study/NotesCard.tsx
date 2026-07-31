import { useState } from "react";
import Card from "./ui/Card";
import type { NoteStatus } from "../../hooks/useNotes";

interface NotesCardProps {
  value:     string;
  onChange:  (text: string) => void;
  status?:   NoteStatus;
  dragging?: boolean;
  onDragStart?: (event: React.PointerEvent<HTMLDivElement>) => void;
  selectionText?: string;
  onAddSelection?: () => void;
  onDismissSelection?: () => void;
  className?: string;
}

const PENCIL_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-3.5 w-3.5"
  >
    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.5a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343Z" />
  </svg>
);

const MAXIMIZE_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-3.5 w-3.5"
  >
    <path
      fillRule="evenodd"
      d="M3 4.25A1.25 1.25 0 0 1 4.25 3h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5Zm9.5-1a.75.75 0 0 1 .75-.75h2.5A1.25 1.25 0 0 1 17 3.75v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1-.75-.75ZM3.75 13.5a.75.75 0 0 1 .75.75v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5A1.25 1.25 0 0 1 3 17v-2.75a.75.75 0 0 1 .75-.75Zm12.5 0a.75.75 0 0 1 .75.75V17a1.25 1.25 0 0 1-1.25 1.25h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5a.75.75 0 0 1 .75-.75Z"
      clipRule="evenodd"
    />
  </svg>
);

const RESTORE_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-3.5 w-3.5"
  >
    <path
      fillRule="evenodd"
      d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z"
      clipRule="evenodd"
    />
    <path
      fillRule="evenodd"
      d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z"
      clipRule="evenodd"
    />
  </svg>
);

const CLOSE_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-3.5 w-3.5"
  >
    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72-3.72a.75.75 0 0 0-1.06-1.06L8.94 10 5.22 6.28Z" />
  </svg>
);

// ── Save status indicator ─────────────────────────────────────────────────────

function SaveStatus({ status }: { status: NoteStatus }) {
  if (status === "idle") return null;

  const config = {
    saving: { text: "Saving…",    className: "text-amber-400" },
    saved:  { text: "Saved",      className: "text-green-500" },
    error:  { text: "Save failed", className: "text-red-500"  },
  } as const;

  const { text, className } = config[status];

  return (
    <span className={`text-[10px] ${className}`}>{text}</span>
  );
}

export default function NotesCard({
  value,
  onChange,
  status = "idle",
  dragging = false,
  onDragStart,
  selectionText = "",
  onAddSelection,
  onDismissSelection,
  className = "",
}: NotesCardProps) {
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);

  // Collapsed state — chip trigger
  if (!open) {
    return (
      <div className={`flex items-start ${className}`}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
        >
          {PENCIL_ICON}
          Notes
        </button>
      </div>
    );
  }

  // Expanded (post-it or maximized)
  const textareaHeight = maximized ? "flex-1" : "h-44";
  const cardHeight = maximized ? "flex flex-col" : "w-76";

  return (
    <div
      className={`${maximized ? "w-full" : "flex items-start"} ${className}`}
    >
      <Card
        padding="none"
        ringColor="ring-amber-200"
        className={`${cardHeight} bg-amber-50 shadow-md ${maximized ? "min-h-[70vh]" : ""}`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-amber-200 px-3 py-2">
          <div
            className={`flex items-center gap-1.5 text-amber-700 ${onDragStart ? "cursor-grab active:cursor-grabbing" : ""}`}
            onPointerDown={(event) => onDragStart?.(event)}
            title={onDragStart ? "Drag notes" : undefined}
          >
            {PENCIL_ICON}
            <span className="text-xs font-semibold uppercase tracking-wider">Notes</span>
            {dragging && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                Moving
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMaximized(!maximized)}
              onPointerDown={(event) => event.stopPropagation()}
              title={maximized ? "Restore" : "Maximize"}
              className="rounded p-1 text-amber-500 transition-colors hover:bg-amber-100 hover:text-amber-700"
            >
              {maximized ? RESTORE_ICON : MAXIMIZE_ICON}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setMaximized(false); }}
              onPointerDown={(event) => event.stopPropagation()}
              title="Close notes"
              className="rounded p-1 text-amber-500 transition-colors hover:bg-amber-100 hover:text-amber-700"
            >
              {CLOSE_ICON}
            </button>
          </div>
        </div>

        {/* Textarea */}
        <div className={`flex ${maximized ? "flex-1" : ""} flex-col px-3 py-2.5`}>
          {selectionText && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-100/70 px-2 py-1.5">
              <p className="line-clamp-1 text-[11px] text-amber-900">{selectionText}</p>
              <button
                type="button"
                onClick={onAddSelection}
                className="shrink-0 rounded-md bg-amber-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white hover:bg-amber-700"
              >
                Add to notes
              </button>
              <button
                type="button"
                onClick={onDismissSelection}
                className="shrink-0 rounded-md border border-amber-300 px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 hover:bg-amber-100"
              >
                Dismiss
              </button>
            </div>
          )}

          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Take notes"
            className={`w-full ${textareaHeight} resize-none rounded-lg border border-amber-200 bg-white/70 px-2.5 py-2 text-sm leading-relaxed text-gray-800 placeholder:text-gray-400 focus:border-amber-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-1 overflow-y-auto`}
          />
          <div className="mt-1.5 flex items-center justify-between">
            <SaveStatus status={status} />
            {value.length > 0 && (
              <p className="text-right text-[10px] text-amber-400">
                {value.length} chars
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
