import Button from "./ui/Button";

interface GoalCardProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: React.ReactNode;
  className?: string;
}

export default function GoalCard({
  title,
  description,
  actionLabel = "Continue",
  onAction,
  illustration,
  className = "",
}: GoalCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ring-1 ring-black/5 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm transition-all hover:shadow-md sm:p-8 ${className}`}
    >
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gray-100 sm:h-24 sm:w-24">
          {illustration ?? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 text-gray-300 sm:h-12 sm:w-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-base font-bold tracking-tight text-gray-900 sm:text-lg">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{description}</p>
          <Button onClick={onAction} className="mt-4">
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
