import { useState } from "react";
import Card from "./ui/Card";
import Breadcrumb from "./ui/Breadcrumb";
import ProgressCells from "./ui/ProgressCells";
import { STATUS_CONFIG, STATUS_ALL_KEYS, type LessonStatus } from "./statusConfig";

interface ProgressCardItem {
  id: string;
  label: string;
  status: LessonStatus;
}

interface ProgressCardProps {
  title: string;
  breadcrumbSegments: { label: string; to?: string }[];
  items: ProgressCardItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  meta?: { label: string; icon?: React.ReactNode }[];
  className?: string;
}

export default function ProgressCard({
  title,
  breadcrumbSegments,
  items,
  selectedId,
  onSelect,
  meta,
  className,
}: ProgressCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card padding="sm" className={className}>
      <Breadcrumb segments={breadcrumbSegments} />

      <h1 className="mt-1.5 text-sm font-semibold tracking-tight text-gray-900 sm:text-base">
        {title}
      </h1>

      {meta && meta.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
          {meta.map((m, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {m.icon}
              {m.label}
            </span>
          )).reduce<React.ReactNode[]>((acc, el, i) => {
            if (i > 0) acc.push(<span key={`sep-${i}`} className="text-gray-300">|</span>);
            acc.push(el);
            return acc;
          }, [])}
        </div>
      )}

      {!expanded && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <ProgressCells
            items={items}
            selectedId={selectedId}
            onSelect={onSelect}
            singleRow
            maxVisible={10}
            className="min-w-0 flex-1"
          />
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="shrink-0 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
          >
            More
          </button>
        </div>
      )}

      {expanded && (
        <>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {STATUS_ALL_KEYS.map((key) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className={`inline-block h-2 w-2 rounded-sm ${STATUS_CONFIG[key].color}`} />
                  <span className="text-[10px] font-medium text-gray-600">{STATUS_CONFIG[key].label}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="shrink-0 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
            >
              Less
            </button>
          </div>

          <ProgressCells
            items={items}
            selectedId={selectedId}
            onSelect={onSelect}
            className="mt-2"
          />
        </>
      )}
    </Card>
  );
}
