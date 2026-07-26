import Card from "./ui/Card";

interface ContentCardProps {
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function ContentCard({
  title,
  subtitle,
  headerRight,
  children,
  className = "",
}: ContentCardProps) {
  return (
    <Card padding="none" className={className}>
      {(title || headerRight) && (
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-semibold text-gray-900 sm:text-base">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </div>
      )}
      <div className="px-5 py-4 sm:px-6 sm:py-5">{children}</div>
    </Card>
  );
}
