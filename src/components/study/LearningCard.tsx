import { useState } from "react";
import LessonItem from "./LessonItem";
import Card from "./ui/Card";

interface LearningSectionData {
  title: string;
  description?: string;
  state: "completed" | "in_progress" | "not_started";
  duration?: string;
  content?: React.ReactNode;
}

interface LearningCardProps {
  title: string;
  estimatedTime?: string;
  learningItems?: LearningSectionData[];
  practiceItems?: LearningSectionData[];
  learningContent?: React.ReactNode;
  practiceContent?: React.ReactNode;
  className?: string;
}

export default function LearningCard({
  title,
  estimatedTime,
  learningItems,
  practiceItems,
  learningContent,
  practiceContent,
  className = "",
}: LearningCardProps) {
  const [activePanel, setActivePanel] = useState<{
    section: "learning" | "practice";
    index: number;
  } | null>(null);
  const expandedSection = activePanel?.section ?? null;

  function panelClass(section: "learning" | "practice"): string {
    if (!expandedSection) return "md:flex-1";
    if (expandedSection === section) return "md:flex-1";
    return "md:w-20 md:shrink-0";
  }

  function sectionCollapsed(section: "learning" | "practice"): boolean {
    return expandedSection !== null && expandedSection !== section;
  }

  function renderSectionLabel(section: "learning" | "practice") {
    const collapsed = sectionCollapsed(section);
    const label = section === "learning" ? "Learning" : "Practice";

    if (!collapsed) {
      return <span>{label}</span>;
    }

    return (
      <span className="hidden items-center justify-center gap-1 md:flex">
        <span
          className="text-[10px] tracking-[0.18em] [writing-mode:vertical-rl]"
          aria-hidden="true"
        >
          {label.toUpperCase()}
        </span>
      </span>
    );
  }

  function renderSection(
    section: "learning" | "practice",
    items: LearningSectionData[] | undefined,
    fallbackContent: React.ReactNode | undefined,
  ) {
    if (!items || items.length === 0) {
      return fallbackContent;
    }

    return items.map((item, index) => (
      <LessonItem
        key={`${section}-${item.title}-${index}`}
        title={item.title}
        description={item.description}
        state={item.state}
        duration={item.duration}
        content={item.content}
        expanded={
          !!item.content &&
          activePanel?.section === section &&
          activePanel.index === index
        }
        onExpandedChange={(expanded) => {
          if (!expanded) {
            if (
              activePanel?.section === section &&
              activePanel.index === index
            ) {
              setActivePanel(null);
            }
            return;
          }
          setActivePanel({ section, index });
        }}
      />
    ));
  }

  return (
    <Card padding="none" className={className}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-gray-900 sm:text-base">{title}</h2>
        {estimatedTime && (
          <span className="shrink-0 text-xs font-medium text-gray-400">{estimatedTime}</span>
        )}
      </div>

      {/* Two-panel body */}
      <div className="flex flex-col gap-4 px-4 py-4 md:flex-row sm:px-5 sm:py-5">
        <div
          className={`flex flex-col gap-3 transition-all duration-300 ${panelClass("learning")}`}
        >
          <button
            type="button"
            onClick={() => {
              if (sectionCollapsed("learning")) {
                setActivePanel(null);
              }
            }}
            className={`text-left text-xs font-semibold uppercase tracking-wider md:min-h-8 ${
              sectionCollapsed("learning")
                ? "text-gray-400 hover:text-gray-600 md:flex md:justify-center"
                : "text-gray-500"
            }`}
          >
            {renderSectionLabel("learning")}
          </button>
          <div
            className={`flex flex-col gap-3 ${
              sectionCollapsed("learning") ? "hidden md:hidden" : ""
            }`}
          >
            {renderSection("learning", learningItems, learningContent)}
          </div>
        </div>

        <div
          className={`flex flex-col gap-3 border-t border-gray-100 pt-3 transition-all duration-300 md:border-l md:border-t-0 md:pl-3 md:pt-0 ${panelClass("practice")}`}
        >
          <button
            type="button"
            onClick={() => {
              if (sectionCollapsed("practice")) {
                setActivePanel(null);
              }
            }}
            className={`text-left text-xs font-semibold uppercase tracking-wider md:min-h-8 ${
              sectionCollapsed("practice")
                ? "text-gray-400 hover:text-gray-600 md:flex md:justify-center"
                : "text-gray-500"
            }`}
          >
            {renderSectionLabel("practice")}
          </button>
          <div
            className={`flex flex-col gap-3 ${
              sectionCollapsed("practice") ? "hidden md:hidden" : ""
            }`}
          >
            {renderSection("practice", practiceItems, practiceContent)}
          </div>
        </div>
      </div>
    </Card>
  );
}
