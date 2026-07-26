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
  return (
    <Card padding="lg" className={className}>
      <Breadcrumb segments={breadcrumbSegments} />

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {title}
      </h1>

      {meta && meta.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
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

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        {STATUS_ALL_KEYS.map((key) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${STATUS_CONFIG[key].color}`} />
            <span className="text-xs font-medium text-gray-600">{STATUS_CONFIG[key].label}</span>
          </div>
        ))}
      </div>

      <ProgressCells items={items} selectedId={selectedId} onSelect={onSelect} className="mt-4" />
    </Card>
  );
}
