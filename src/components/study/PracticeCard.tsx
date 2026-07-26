import Card from "./ui/Card";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import StatusDot from "./ui/StatusDot";

type PracticeStatus = "not_started" | "in_progress" | "completed";

interface PracticeCardProps {
  title: string;
  description: string;
  progressLabel: string;
  badge: string;
  status?: PracticeStatus;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const STATUS_RING: Record<PracticeStatus, string> = {
  completed: "ring-green-200",
  in_progress: "ring-blue-200",
  not_started: "ring-black/5",
};

const STATUS_BG: Record<PracticeStatus, string> = {
  completed: "bg-green-50/60",
  in_progress: "bg-blue-50/60",
  not_started: "",
};

const BADGE_VARIANT: Record<PracticeStatus, "green" | "blue" | "gray"> = {
  completed: "green",
  in_progress: "blue",
  not_started: "gray",
};

const LABEL: Record<PracticeStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
  not_started: "Not started",
};

export default function PracticeCard({
  title,
  description,
  progressLabel,
  badge,
  status = "not_started",
  actionLabel = "Start",
  onAction,
  disabled = false,
  className = "",
  children,
}: PracticeCardProps) {
  const isCompleted = status === "completed";
  const isDisabled = disabled || isCompleted;

  return (
    <Card
      padding="none"
      ringColor={STATUS_RING[status]}
      className={`group transition-all hover:shadow-md ${STATUS_BG[status]} ${disabled && !isCompleted ? "opacity-50" : ""} ${className}`}
    >
      <div className="p-5 sm:p-6">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <Badge variant={BADGE_VARIANT[status]}>{badge}</Badge>
          <span className="flex items-center gap-1.5">
            <StatusDot status={status} />
            <span className="text-[11px] font-medium capitalize text-gray-500">{LABEL[status]}</span>
          </span>
        </div>

        {/* Title + description */}
        <h3 className="mt-3 text-sm font-semibold text-gray-900 sm:text-base">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-500 sm:text-sm">{description}</p>

        {/* Progress requirement */}
        <p className="mt-3 text-xs font-medium text-gray-400">{progressLabel}</p>

        {children && <div className="mt-3">{children}</div>}
      </div>

      {/* Action button — full width in card footer */}
      <div className="border-t border-gray-100 px-5 py-3 sm:px-6">
        <Button
          variant={isCompleted ? "success" : isDisabled ? "disabled" : "primary"}
          fullWidth
          onClick={onAction}
          disabled={isDisabled}
        >
          {isCompleted ? "Completed" : actionLabel}
        </Button>
      </div>
    </Card>
  );
}
