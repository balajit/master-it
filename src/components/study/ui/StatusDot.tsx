interface StatusDotProps {
  status: "completed" | "in_progress" | "not_started" | string;
  size?: "sm" | "md";
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500",
  in_progress: "bg-blue-500",
  not_started: "bg-gray-300",
  mastered: "bg-green-500",
  practiced: "bg-blue-500",
  familiar: "bg-purple-500",
  attempted: "bg-amber-400",
};

const SIZE = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
};

export default function StatusDot({ status, size = "sm", className = "" }: StatusDotProps) {
  return (
    <span
      className={`inline-block rounded-full ${SIZE[size]} ${STATUS_COLORS[status] ?? "bg-gray-300"} ${className}`}
    />
  );
}
