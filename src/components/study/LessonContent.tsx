/**
 * LessonContent.tsx — Renders an ordered array of ContentItem objects.
 *
 * Each item type maps to a styled React element. Equation items are rendered
 * with KaTeX. All other styling uses Tailwind classes.
 *
 * Backend schema discriminator values:
 *   "text" | "heading" | "image" | "table" | "equation" | "code" | "list"
 *
 * Usage:
 *   <LessonContent items={page.items} />
 */

import katex from "katex";
import "katex/dist/katex.min.css";
import type { ContentItem } from "../../types/contentNode";

// ── Item renderer ─────────────────────────────────────────────────────────────

function RenderItem({ item, index }: { item: ContentItem; index: number }) {
  switch (item.type) {
    case "heading": {
      const level = Math.max(1, Math.min(item.level ?? 1, 4));
      if (level === 1) {
        return (
          <h2 key={index} className="mt-4 text-base font-bold text-gray-900 sm:text-lg">
            {item.content}
          </h2>
        );
      }
      if (level === 2) {
        return (
          <h3 key={index} className="mt-3 text-sm font-semibold text-gray-900 sm:text-base">
            {item.content}
          </h3>
        );
      }
      return (
        <h4 key={index} className="mt-2 text-sm font-semibold text-gray-700">
          {item.content}
        </h4>
      );
    }

    case "text":
      return (
        <p key={index} className="text-sm leading-relaxed text-gray-700">
          {item.content}
        </p>
      );

    case "list": {
      const listClass = "ml-5 flex flex-col gap-1 text-sm text-gray-700";
      if (item.ordered) {
        return (
          <ol key={index} className={`${listClass} list-decimal`}>
            {item.items.map((text, i) => (
              <li key={i} className="leading-relaxed">{text}</li>
            ))}
          </ol>
        );
      }
      return (
        <ul key={index} className={`${listClass} list-disc`}>
          {item.items.map((text, i) => (
            <li key={i} className="leading-relaxed">{text}</li>
          ))}
        </ul>
      );
    }

    case "equation": {
      let html: string;
      try {
        html = katex.renderToString(item.latex, { throwOnError: true, displayMode: true });
      } catch (err) {
        html = `<span class="font-mono text-xs text-red-500">${String(err)}</span>`;
      }
      return (
        <div key={index} className="my-3 overflow-x-auto rounded-lg bg-gray-50 px-4 py-3 text-center">
          {item.label && (
            <span className="float-right text-xs text-gray-400">{item.label}</span>
          )}
          <span dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      );
    }

    case "code":
      return (
        <div key={index} className="my-2 overflow-x-auto rounded-lg bg-gray-900">
          {item.language && (
            <div className="border-b border-gray-700 px-4 py-1.5 text-xs text-gray-400">
              {item.language}
            </div>
          )}
          <pre className="px-4 py-3 text-xs leading-relaxed text-gray-100">
            <code>{item.content}</code>
          </pre>
        </div>
      );

    case "table":
      return (
        <div key={index} className="my-2 overflow-x-auto">
          {item.caption && (
            <p className="mb-1 text-xs text-gray-500">{item.caption}</p>
          )}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                {item.headers.map((h, hi) => (
                  <th
                    key={hi}
                    className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-700"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {item.rows.map((row, ri) => (
                <tr key={ri} className="odd:bg-white even:bg-gray-50">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="border border-gray-200 px-3 py-2 text-left text-xs text-gray-700"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "image":
      return (
        <figure key={index} className="my-3 text-center">
          {item.data && (
            <img
              src={`data:image/png;base64,${item.data}`}
              alt={item.caption ?? ""}
              className="mx-auto max-w-full rounded-lg border border-gray-200"
            />
          )}
          {item.caption && (
            <figcaption className="mt-1 text-xs text-gray-500">{item.caption}</figcaption>
          )}
        </figure>
      );
  }
}

// ── Public component ──────────────────────────────────────────────────────────

interface LessonContentProps {
  items: ContentItem[];
  className?: string;
}

export default function LessonContent({ items, className = "" }: LessonContentProps) {
  if (items.length === 0) return null;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {items.map((item, i) => (
        <RenderItem key={item.id ?? i} item={item} index={i} />
      ))}
    </div>
  );
}
