import { STATUS_CONFIG, type LessonStatus } from "../statusConfig";

interface ProgressCellsProps {
  items: { id: string; label: string; status: LessonStatus }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export default function ProgressCells({ items, selectedId, onSelect, className = "" }: ProgressCellsProps) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`} role="group" aria-label="Lesson progress">
      {items.map((item) => {
        const isSelected = item.id === selectedId;
        return (
          <button
            key={item.id}
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
