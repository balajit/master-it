import { useState } from "react";
import type { ReactNode } from "react";

type ItemStatus = "completed" | "in_progress" | "not_started";

interface SidebarItemData {
  id: string;
  label: string;
  icon?: ReactNode;
  meta?: string;
  status?: ItemStatus;
  children?: SidebarItemData[];
}

interface SidebarGroupProps {
  title: string;
  items: SidebarItemData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  defaultExpanded?: boolean;
}

const STATUS_ICON: Record<ItemStatus, { class: string; svg: ReactNode }> = {
  completed: {
    class: "text-green-500",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
      </svg>
    ),
  },
  in_progress: {
    class: "text-blue-500",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M10 1a6 6 0 1 0 0 12 6 6 0 0 0 0-12ZM6 10a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" />
      </svg>
    ),
  },
  not_started: {
    class: "text-gray-300",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8 9a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V10a1 1 0 0 0-1-1Z" />
      </svg>
    ),
  },
};

function SidebarItem({
  item,
  selectedId,
  onSelect,
  depth = 0,
}: {
  item: SidebarItemData;
  selectedId: string | null;
  onSelect: (id: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.id === selectedId;

  return (
    <li>
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => onSelect(item.id)}
          className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
            isActive
              ? "bg-gray-900 font-medium text-white"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {item.icon && (
            <span className={`shrink-0 ${isActive ? "text-white/70" : "text-gray-400"}`}>
              {item.icon}
            </span>
          )}
          {!item.icon && item.status && (
            <span className={`shrink-0 ${isActive ? "text-white/70" : STATUS_ICON[item.status].class}`}>
              {STATUS_ICON[item.status].svg}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.meta && (
            <span className={`shrink-0 text-[10px] ${isActive ? "text-white/50" : "text-gray-400"}`}>
              {item.meta}
            </span>
          )}
        </button>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="ml-0.5 shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`}
            >
              <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      {hasChildren && expanded && (
        <ul className="flex flex-col gap-0.5">
          {item.children!.map((child) => (
            <SidebarItem
              key={child.id}
              item={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function SidebarGroup({
  title,
  items,
  selectedId,
  onSelect,
  defaultExpanded = true,
}: SidebarGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-gray-50 rounded-lg"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
        >
          <path
            fillRule="evenodd"
            d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {title}
        </span>
      </button>

      {expanded && (
        <ul className="ml-2 flex flex-col gap-0.5 border-l border-gray-100 pl-1">
          {items.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
