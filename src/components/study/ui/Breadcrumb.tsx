import { Link } from "react-router";

interface BreadcrumbSegment {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
  className?: string;
}

function Chevron() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 shrink-0 text-gray-300">
      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
    </svg>
  );
}

export default function Breadcrumb({ segments, className = "" }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center gap-1.5 text-xs text-gray-400 ${className}`}>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <Chevron />}
            {seg.to && !isLast ? (
              <Link to={seg.to} className="truncate transition-colors hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 rounded-sm">
                {seg.label}
              </Link>
            ) : (
              <span className={`truncate ${isLast ? "font-medium text-gray-700" : ""}`}>
                {seg.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
