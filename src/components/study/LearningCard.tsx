import Card from "./ui/Card";

interface LearningCardProps {
  title: string;
  estimatedTime?: string;
  learningContent: React.ReactNode;
  practiceContent: React.ReactNode;
  className?: string;
}

export default function LearningCard({
  title,
  estimatedTime,
  learningContent,
  practiceContent,
  className = "",
}: LearningCardProps) {
  return (
    <Card padding="none" className={className}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold text-gray-900 sm:text-base">{title}</h2>
        {estimatedTime && (
          <span className="shrink-0 text-xs font-medium text-gray-400">{estimatedTime}</span>
        )}
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 gap-6 px-5 py-5 md:grid-cols-2 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Learning</h3>
          <div className="flex flex-col gap-3">{learningContent}</div>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Practice</h3>
          <div className="flex flex-col gap-3">{practiceContent}</div>
        </div>
      </div>
    </Card>
  );
}
