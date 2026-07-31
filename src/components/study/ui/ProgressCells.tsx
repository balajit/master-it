import { useEffect, useRef } from "react";
import { STATUS_CONFIG, type LessonStatus } from "../statusConfig";

interface ProgressCellsProps {
  items: { id: string; label: string; status: LessonStatus }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  singleRow?: boolean;
  maxVisible?: number;
  className?: string;
}

export default function ProgressCells({
  items,
  selectedId,
  onSelect,
  singleRow = false,
  maxVisible,
  className = "",
}: ProgressCellsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedIndex = selectedId
    ? items.findIndex((item) => item.id === selectedId)
    : -1;

  const visibleItems = (() => {
    if (!singleRow || !maxVisible || items.length <= maxVisible) {
      return items;
    }
    if (selectedIndex < 0) {
      return items.slice(0, maxVisible);
    }

    const beforeCount = Math.floor((maxVisible - 1) / 2);
    let start = selectedIndex - beforeCount;
    if (start < 0) start = 0;

    let end = start + maxVisible;
    if (end > items.length) {
      end = items.length;
      start = Math.max(0, end - maxVisible);
    }

    return items.slice(start, end);
  })();

  useEffect(() => {
    if (!singleRow || !selectedId) return;
    const container = containerRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLButtonElement>(
      `button[data-item-id="${selectedId}"]`,
    );
    if (!active) return;
    active.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selectedId, singleRow]);

  return (
    <div
      ref={containerRef}
      className={`flex gap-1.5 ${singleRow ? "overflow-x-auto overflow-y-hidden whitespace-nowrap pb-1" : "flex-wrap"} ${className}`}
      role="group"
      aria-label="Lesson progress"
    >
      {visibleItems.map((item) => {
        const isSelected = item.id === selectedId;
        return (
          <button
            key={item.id}
            data-item-id={item.id}
            type="button"
            title={item.label}
            aria-label={`${item.label} — ${STATUS_CONFIG[item.status].label}`}
            onClick={() => onSelect(item.id)}
            className={`h-5 w-5 rounded-sm transition-all sm:h-6 sm:w-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 ${STATUS_CONFIG[item.status].cellClass} ${
              isSelected ? "ring-2 ring-offset-1 ring-gray-900" : "hover:opacity-80"
            }`}
          />
        );
      })}
    </div>
  );
}
