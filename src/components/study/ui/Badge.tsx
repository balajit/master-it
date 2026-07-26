interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "green" | "blue" | "purple" | "amber" | "gray";
  className?: string;
}

const VARIANT_CLASSES: Record<string, string> = {
  default: "bg-gray-100 text-gray-700",
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  amber: "bg-amber-100 text-amber-700",
  gray: "bg-gray-100 text-gray-600",
};

export default function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
