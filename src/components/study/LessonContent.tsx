/**
 * LessonContent.tsx — Renders an ordered array of ContentNode objects.
 *
 * Each node type maps to a styled React element. Equation nodes (block and
 * inline) are rendered with KaTeX directly via katex.renderToString. All
 * other styling uses Tailwind classes.
 *
 * Usage:
 *   <LessonContent nodes={lesson.content} />
 */

import katex from "katex";
import "katex/dist/katex.min.css";
import type {
  ContentNode,
  InlineRun,
  ListItemNode,
} from "../../types/contentNode";

// ── Inline run renderer ───────────────────────────────────────────────────────

function RenderRun({ run }: { run: InlineRun }) {
  switch (run.run_type) {
    case "text":
      return <span>{run.text}</span>;
    case "eq": {
      let html: string;
      try {
        html = katex.renderToString(run.latex, { throwOnError: true });
      } catch (err) {
        return <span className="font-mono text-xs text-red-500">{String(err)}</span>;
      }
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    }
    case "bold":
      return <strong className="font-semibold">{run.text}</strong>;
    case "italic":
      return <em>{run.text}</em>;
    case "code":
      return (
        <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.8em] text-gray-800">
          {run.text}
        </code>
      );
    case "link":
      return (
        <a
          href={run.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800"
        >
          {run.text}
        </a>
      );
  }
}

function RenderRuns({ runs }: { runs: InlineRun[] }) {
  return (
    <>
      {runs.map((run, i) => (
        <RenderRun key={i} run={run} />
      ))}
    </>
  );
}

function RenderListItem({ item }: { item: ListItemNode }) {
  return (
    <li className="leading-relaxed">
      <RenderRuns runs={item.runs} />
    </li>
  );
}

// ── Note / callout variant configs ───────────────────────────────────────────

const NOTE_STYLES: Record<string, string> = {
  info:    "border-blue-200 bg-blue-50 text-blue-900",
  tip:     "border-green-200 bg-green-50 text-green-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger:  "border-red-200 bg-red-50 text-red-900",
};

const NOTE_LABEL: Record<string, string> = {
  info:    "Info",
  tip:     "Tip",
  warning: "Warning",
  danger:  "Danger",
};

const CALLOUT_STYLES: Record<string, string> = {
  example:     "border-indigo-200 bg-indigo-50 text-indigo-900",
  non_example: "border-orange-200 bg-orange-50 text-orange-900",
  reminder:    "border-purple-200 bg-purple-50 text-purple-900",
};

const CALLOUT_LABEL: Record<string, string> = {
  example:     "Example",
  non_example: "Non-Example",
  reminder:    "Reminder",
};

// ── Node renderer ─────────────────────────────────────────────────────────────

function RenderNode({ node, index }: { node: ContentNode; index: number }) {
  switch (node.type) {
    case "heading": {
      const number = node.number ? `${node.number} ` : "";
      if (node.level === 1) {
        return (
          <h2 key={index} className="mt-4 text-base font-bold text-gray-900 sm:text-lg">
            {number}{node.text}
          </h2>
        );
      }
      if (node.level === 2) {
        return (
          <h3 key={index} className="mt-3 text-sm font-semibold text-gray-900 sm:text-base">
            {number}{node.text}
          </h3>
        );
      }
      return (
        <h4 key={index} className="mt-2 text-sm font-semibold text-gray-700">
          {number}{node.text}
        </h4>
      );
    }

    case "paragraph":
      return (
        <p key={index} className="text-sm leading-relaxed text-gray-700">
          <RenderRuns runs={node.runs} />
        </p>
      );

    case "list": {
      const items = node.items.map((item, i) => (
        <RenderListItem key={i} item={item} />
      ));
      const listClass = "ml-5 flex flex-col gap-1 text-sm text-gray-700";
      if (node.style === "numbered" || node.style === "alpha" || node.style === "roman") {
        const listStyleMap: Record<string, string> = {
          numbered: "list-decimal",
          alpha:    "list-[lower-alpha]",
          roman:    "list-[lower-roman]",
        };
        return (
          <ol key={index} className={`${listClass} ${listStyleMap[node.style] ?? "list-decimal"}`}>
            {items}
          </ol>
        );
      }
      if (node.style === "checkbox") {
        return (
          <ul key={index} className={`${listClass} list-none`}>
            {node.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 leading-relaxed">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gray-400 bg-white" />
                <RenderRuns runs={item.runs} />
              </li>
            ))}
          </ul>
        );
      }
      return (
        <ul key={index} className={`${listClass} list-disc`}>
          {items}
        </ul>
      );
    }

    case "equation": {
      let html: string;
      try {
        html = katex.renderToString(node.latex, { throwOnError: true, displayMode: true });
      } catch (err) {
        html = `<span class="font-mono text-xs text-red-500">${String(err)}</span>`;
      }
      return (
        <div key={index} className="my-3 overflow-x-auto rounded-lg bg-gray-50 px-4 py-3 text-center">
          {node.label && (
            <span className="float-right text-xs text-gray-400">{node.label}</span>
          )}
          <span dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      );
    }

    case "code_block":
      return (
        <div key={index} className="my-2 overflow-x-auto rounded-lg bg-gray-900">
          {node.language && (
            <div className="border-b border-gray-700 px-4 py-1.5 text-xs text-gray-400">
              {node.language}
            </div>
          )}
          <pre className="px-4 py-3 text-xs leading-relaxed text-gray-100">
            <code>{node.code}</code>
          </pre>
        </div>
      );

    case "table":
      return (
        <div key={index} className="my-2 overflow-x-auto">
          {node.caption && (
            <p className="mb-1 text-xs text-gray-500">{node.caption}</p>
          )}
          <table className="w-full border-collapse text-sm">
            <tbody>
              {node.rows.map((row, ri) => (
                <tr
                  key={ri}
                  className={row.is_header ? "bg-gray-100 font-semibold" : "odd:bg-white even:bg-gray-50"}
                >
                  {row.cells.map((cell, ci) => {
                    const Tag = cell.header || row.is_header ? "th" : "td";
                    return (
                      <Tag
                        key={ci}
                        colSpan={cell.col_span}
                        rowSpan={cell.row_span}
                        className="border border-gray-200 px-3 py-2 text-left text-xs text-gray-700"
                      >
                        {cell.text}
                      </Tag>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "note": {
      const noteStyle = NOTE_STYLES[node.variant] ?? NOTE_STYLES.info;
      const noteLabel = NOTE_LABEL[node.variant] ?? "Note";
      return (
        <div key={index} className={`my-2 rounded-lg border px-4 py-3 text-sm ${noteStyle}`}>
          <span className="mr-2 font-semibold">{noteLabel}:</span>
          <RenderRuns runs={node.runs} />
        </div>
      );
    }

    case "callout": {
      const calloutStyle = CALLOUT_STYLES[node.variant] ?? CALLOUT_STYLES.example;
      const calloutLabel = node.title || CALLOUT_LABEL[node.variant] || "Example";
      return (
        <div key={index} className={`my-2 rounded-lg border px-4 py-3 text-sm ${calloutStyle}`}>
          <p className="mb-1 font-semibold">{calloutLabel}</p>
          <p className="leading-relaxed">
            <RenderRuns runs={node.runs} />
          </p>
        </div>
      );
    }

    case "definition":
      return (
        <div key={index} className="my-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
          <span className="font-semibold text-gray-900">{node.term}: </span>
          <span className="text-gray-700">{node.definition}</span>
        </div>
      );

    case "figure":
      return (
        <figure key={index} className="my-3 text-center">
          {node.image_url && (
            <img
              src={node.image_url}
              alt={node.alt_text ?? ""}
              className="mx-auto max-w-full rounded-lg border border-gray-200"
            />
          )}
          {node.caption && (
            <figcaption className="mt-1 text-xs text-gray-500">{node.caption}</figcaption>
          )}
        </figure>
      );
  }
}

// ── Public component ──────────────────────────────────────────────────────────

interface LessonContentProps {
  nodes: ContentNode[];
  className?: string;
}

export default function LessonContent({ nodes, className = "" }: LessonContentProps) {
  if (nodes.length === 0) return null;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {nodes.map((node, i) => (
        <RenderNode key={i} node={node} index={i} />
      ))}
    </div>
  );
}
