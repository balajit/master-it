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
import { useState } from "react";
import type { ReactNode } from "react";
import type { ContentItem, RichTextRun } from "../../types/contentNode";

function getAlignmentClass(alignment?: string | null): string {
  if (!alignment) return "";
  const normalized = alignment.toLowerCase();
  if (normalized === "center") return "text-center";
  if (normalized === "right") return "text-right";
  if (normalized === "justify") return "text-justify";
  return "text-left";
}

function getIndentClass(indentLevel?: number): string {
  const level = Math.max(0, Math.min(indentLevel ?? 0, 6));
  if (level === 0) return "";
  const indentMap = ["", "ml-4", "ml-8", "ml-12", "ml-16", "ml-20", "ml-24"];
  return indentMap[level] ?? "ml-24";
}

function getQuestionKind(questionType: string): "multiple_choice" | "true_false" | "fill_blank" | "statement" | "generic" {
  const normalized = questionType.trim().toLowerCase();
  if (
    normalized.includes("multiple") ||
    normalized.includes("mcq") ||
    normalized.includes("single_choice") ||
    normalized.includes("single-choice") ||
    normalized.includes("choice")
  ) {
    return "multiple_choice";
  }
  if (
    normalized.includes("true_false") ||
    normalized.includes("true-false") ||
    normalized.includes("boolean")
  ) {
    return "true_false";
  }
  if (
    normalized.includes("fill") ||
    normalized.includes("blank") ||
    normalized.includes("cloze")
  ) {
    return "fill_blank";
  }
  if (
    normalized.includes("statement") ||
    normalized.includes("matching") ||
    normalized.includes("match")
  ) {
    return "statement";
  }
  return "generic";
}

function normalizeComparableText(value: string): string {
  return value
    .trim()
    .replace(/^\d+[.)\-:\s]+/, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function renderContentWithBlankSpans(
  content: string,
  hasFillInBlanks?: boolean | null,
  blankSpanPositions?: number[],
  fillInBlankIds?: number[],
): ReactNode {
  if (!hasFillInBlanks) return content;

  const positions = Array.isArray(blankSpanPositions) ? blankSpanPositions : [];
  const hasPairPositions = positions.length >= 2 && positions.length % 2 === 0;

  if (hasPairPositions) {
    const nodes: ReactNode[] = [];
    let cursor = 0;
    let blankIndex = 0;

    for (let i = 0; i < positions.length; i += 2) {
      const start = positions[i] ?? 0;
      const end = positions[i + 1] ?? start;
      if (start < cursor || end <= start || start > content.length || end > content.length) {
        continue;
      }

      if (start > cursor) {
        nodes.push(<span key={`txt-${i}`}>{content.slice(cursor, start)}</span>);
      }

      const blankId = fillInBlankIds?.[blankIndex] ?? blankIndex + 1;
      nodes.push(
        <span key={`blank-${i}`} className="mx-0.5 inline-flex min-w-14 items-center justify-center rounded border border-blue-300 bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700">
          [{blankId}]
        </span>,
      );

      cursor = end;
      blankIndex += 1;
    }

    if (cursor < content.length) {
      nodes.push(<span key="txt-tail">{content.slice(cursor)}</span>);
    }

    if (nodes.length > 0) return <>{nodes}</>;
  }

  const fallbackCount = fillInBlankIds?.length ?? 0;
  if (fallbackCount > 0) {
    return (
      <>
        <span>{content}</span>
        <span className="ml-2 inline-flex flex-wrap gap-1">
          {fillInBlankIds?.map((blankId) => (
            <span
              key={`fallback-blank-${blankId}`}
              className="inline-flex min-w-14 items-center justify-center rounded border border-blue-300 bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700"
            >
              [{blankId}]
            </span>
          ))}
        </span>
      </>
    );
  }

  return content;
}

function RenderRichText({ runs, fallback }: { runs?: RichTextRun[]; fallback: string }) {
  if (!runs || runs.length === 0) return <>{fallback}</>;

  return (
    <>
      {runs.map((run, i) => {
        const className = [
          run.isBold ? "font-semibold" : "",
          run.isItalic ? "italic" : "",
          run.isUnderline ? "underline" : "",
          run.isStrikethrough ? "line-through" : "",
        ]
          .filter(Boolean)
          .join(" ");

        if (run.linkTarget) {
          return (
            <a
              key={i}
              href={run.linkTarget}
              target="_blank"
              rel="noreferrer"
              className={`text-blue-700 underline ${className}`.trim()}
            >
              {run.text}
            </a>
          );
        }

        return (
          <span key={i} className={className || undefined}>
            {run.text}
          </span>
        );
      })}
    </>
  );
}

// ── Item renderer ─────────────────────────────────────────────────────────────

function RenderItem({ item, index }: { item: ContentItem; index: number }) {
  const [tfAnswers, setTfAnswers] = useState<Record<number, boolean | null>>({});

  switch (item.type) {
    case "heading": {
      const level = Math.max(1, Math.min(item.level ?? 1, 4));
      if (level === 1) {
        return (
          <h2
            key={index}
            className={`mt-4 text-base font-bold text-gray-900 sm:text-lg ${getAlignmentClass(item.blockStyle?.alignment)} ${getIndentClass(item.blockStyle?.indentLevel)}`.trim()}
          >
            {item.headingNumber ? <span className="mr-2 text-gray-500">{item.headingNumber}</span> : null}
            <RenderRichText runs={item.textRuns} fallback={item.content} />
          </h2>
        );
      }
      if (level === 2) {
        return (
          <h3
            key={index}
            className={`mt-3 text-sm font-semibold text-gray-900 sm:text-base ${getAlignmentClass(item.blockStyle?.alignment)} ${getIndentClass(item.blockStyle?.indentLevel)}`.trim()}
          >
            {item.headingNumber ? <span className="mr-2 text-gray-500">{item.headingNumber}</span> : null}
            <RenderRichText runs={item.textRuns} fallback={item.content} />
          </h3>
        );
      }
      return (
        <h4
          key={index}
          className={`mt-2 text-sm font-semibold text-gray-700 ${getAlignmentClass(item.blockStyle?.alignment)} ${getIndentClass(item.blockStyle?.indentLevel)}`.trim()}
        >
          {item.headingNumber ? <span className="mr-2 text-gray-500">{item.headingNumber}</span> : null}
          <RenderRichText runs={item.textRuns} fallback={item.content} />
        </h4>
      );
    }

    case "text":
      return (
        <p
          key={index}
          className={`text-sm leading-relaxed text-gray-700 ${getAlignmentClass(item.blockStyle?.alignment)} ${getIndentClass(item.blockStyle?.indentLevel)}`.trim()}
        >
          {item.numberedItem != null ? (
            <span className="mr-1 font-semibold text-gray-600">{item.numberedItem}.</span>
          ) : null}
          {item.hasFillInBlanks
            ? renderContentWithBlankSpans(
                item.content,
                item.hasFillInBlanks,
                item.blankSpanPositions,
                item.fillInBlankIds,
              )
            : <RenderRichText runs={item.textRuns} fallback={item.content} />}
        </p>
      );

    case "list": {
      const listClass = `ml-5 flex flex-col gap-1 text-sm text-gray-700 ${getAlignmentClass(item.blockStyle?.alignment)} ${getIndentClass(item.blockStyle?.indentLevel)}`.trim();
      const isOrdered = item.listStyle === "numbered" || item.listStyle === "roman" || item.listStyle === "alpha" || item.ordered;
      if (item.ordered) {
        return (
          <ol key={index} className={`${listClass} list-decimal`}>
            {item.items.map((text, i) => (
              <li key={i} className="leading-relaxed">
                <RenderRichText runs={item.itemTextRuns?.[i]} fallback={text} />
              </li>
            ))}
          </ol>
        );
      }
      if (item.listStyle === "checkbox") {
        return (
          <ul key={index} className={`${listClass} list-none`}>
            {item.items.map((text, i) => (
              <li key={i} className="leading-relaxed">
                <span className="mr-2 text-gray-400">[ ]</span>
                <RenderRichText runs={item.itemTextRuns?.[i]} fallback={text} />
              </li>
            ))}
          </ul>
        );
      }
      if (isOrdered) {
        return (
          <ol key={index} className={`${listClass} list-decimal`}>
            {item.items.map((text, i) => (
              <li key={i} className="leading-relaxed">
                <RenderRichText runs={item.itemTextRuns?.[i]} fallback={text} />
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul key={index} className={`${listClass} list-disc`}>
          {item.items.map((text, i) => (
            <li key={i} className="leading-relaxed">
              <RenderRichText runs={item.itemTextRuns?.[i]} fallback={text} />
            </li>
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
          {(item.language || item.filename) && (
            <div className="flex items-center justify-between border-b border-gray-700 px-4 py-1.5 text-xs text-gray-400">
              <span>{item.language || "code"}</span>
              {item.filename ? (
                <span className="text-[10px] text-gray-500">
                  {item.filename}
                  {item.lineStart ? `:${item.lineStart}` : ""}
                </span>
              ) : null}
            </div>
          )}
          <pre className="px-4 py-3 text-xs leading-relaxed text-gray-100">
            <code>{item.content}</code>
          </pre>
        </div>
      );

    case "table":
      return (
        <div
          key={index}
          className={`my-2 overflow-x-auto ${getAlignmentClass(item.blockStyle?.alignment)} ${getIndentClass(item.blockStyle?.indentLevel)}`.trim()}
        >
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
          {(item.rowCount != null || item.columnCount != null) && (
            <p className="mt-1 text-[10px] text-gray-400">
              {item.rowCount ?? item.rows.length} rows · {item.columnCount ?? item.headers.length} columns
            </p>
          )}
        </div>
      );

    case "image":
      return (
        <figure key={index} className="my-3 text-center">
          {item.data && (
            <img
              src={item.imageUrl || `data:image/png;base64,${item.data}`}
              alt={item.altText || item.caption || ""}
              className="mx-auto max-w-full rounded-lg border border-gray-200"
            />
          )}
          {(item.width || item.height) && (
            <p className="mt-1 text-[10px] text-gray-400">
              {item.width ?? "?"} x {item.height ?? "?"} px{item.mimeType ? ` · ${item.mimeType}` : ""}
            </p>
          )}
          {item.caption && (
            <figcaption className="mt-1 text-xs text-gray-500">{item.caption}</figcaption>
          )}
        </figure>
      );

    case "question": {
      const kind = getQuestionKind(item.questionType);
      const normalizedPrompt = normalizeComparableText(item.content);
      const normalizedStatements = item.statements.map((s) => normalizeComparableText(s.text));
      const promptDuplicatesStatement =
        normalizedPrompt.length > 0 && normalizedStatements.includes(normalizedPrompt);
      const normalizedSolution = item.solution.trim().toLowerCase();
      const solutionLooksBoolean =
        normalizedSolution === "true" ||
        normalizedSolution === "false" ||
        normalizedSolution === "t" ||
        normalizedSolution === "f";

      const hasTrueFalseOptions = item.options.some(
        (opt) => opt.text.trim().toLowerCase() === "true" || opt.text.trim().toLowerCase() === "false",
      );

      const showTrueFalsePicker = kind === "true_false" || hasTrueFalseOptions || solutionLooksBoolean;
      const renderTrueFalseFromStatements = showTrueFalsePicker && item.statements.length > 0;
      const renderTrueFalseFromPrompt = showTrueFalsePicker && item.statements.length === 0 && item.content.trim().length > 0;
      const showPrompt =
        !promptDuplicatesStatement &&
        kind !== "statement" &&
        !renderTrueFalseFromStatements &&
        !renderTrueFalseFromPrompt;

      return (
        <div
          key={index}
          className={`my-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3 ${getAlignmentClass(item.blockStyle?.alignment)} ${getIndentClass(item.blockStyle?.indentLevel)}`.trim()}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-blue-700">
              {item.points} pt{item.points === 1 ? "" : "s"}
            </span>
          </div>

          {item.content && showPrompt && (
            <p className="text-sm font-medium text-gray-900">
              {item.numberedItem != null ? (
                <span className="mr-1 text-gray-600">{item.numberedItem}.</span>
              ) : null}
              {renderContentWithBlankSpans(
                item.content,
                item.hasFillInBlanks,
                item.blankSpanPositions,
                item.fillInBlankIds,
              )}
            </p>
          )}

          {kind === "multiple_choice" && item.options.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-gray-700">
              {item.options.map((option, optionIndex) => (
                <li key={`${item.id}-option-${optionIndex}`} className="rounded-md border border-blue-100 bg-white px-2.5 py-1.5">
                  <span className="mr-2 text-xs font-semibold text-blue-700">{option.label}</span>
                  <span>{option.text}</span>
                </li>
              ))}
            </ul>
          )}

          {(kind === "statement" || renderTrueFalseFromStatements) && item.statements.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1 text-sm text-gray-700">
              {item.statements.map((statement, statementIndex) => (
                <li key={`${item.id}-statement-${statementIndex}`} className="rounded-md border border-blue-100 bg-white px-2.5 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1">
                      <span className="mr-1 font-semibold text-gray-600">
                        {statement.number != null ? `${statement.number}.` : "-"}
                      </span>
                      <span>{statement.text}</span>
                    </p>
                    {showTrueFalsePicker && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setTfAnswers((prev) => ({
                              ...prev,
                              [statementIndex]: prev[statementIndex] === true ? null : true,
                            }));
                          }}
                          className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${
                            tfAnswers[statementIndex] === true
                              ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          True
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTfAnswers((prev) => ({
                              ...prev,
                              [statementIndex]: prev[statementIndex] === false ? null : false,
                            }));
                          }}
                          className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${
                            tfAnswers[statementIndex] === false
                              ? "border-rose-300 bg-rose-100 text-rose-800"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          False
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {renderTrueFalseFromPrompt && (
            <div className="mt-2 rounded-md border border-blue-100 bg-white px-2.5 py-2">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 text-sm text-gray-700">
                  {item.numberedItem != null ? (
                    <span className="mr-1 text-gray-600">{item.numberedItem}.</span>
                  ) : null}
                  {renderContentWithBlankSpans(
                    item.content,
                    item.hasFillInBlanks,
                    item.blankSpanPositions,
                    item.fillInBlankIds,
                  )}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTfAnswers((prev) => ({
                        ...prev,
                        0: prev[0] === true ? null : true,
                      }));
                    }}
                    className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${
                      tfAnswers[0] === true
                        ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    True
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTfAnswers((prev) => ({
                        ...prev,
                        0: prev[0] === false ? null : false,
                      }));
                    }}
                    className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${
                      tfAnswers[0] === false
                        ? "border-rose-300 bg-rose-100 text-rose-800"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    False
                  </button>
                </div>
              </div>
            </div>
          )}

          {kind === "fill_blank" && item.blanks.length > 0 && (
            <div className="mt-2 rounded-md border border-blue-100 bg-white p-2 text-xs text-gray-700">
              <p className="font-semibold text-gray-800">Blanks</p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {item.blanks.map((blank) => (
                  <li key={`${item.id}-blank-${blank.blankId}`}>
                    <span className="font-medium">#{blank.blankId}:</span> {blank.answer}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {kind === "generic" && item.options.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-gray-700">
              {item.options.map((option, optionIndex) => (
                <li key={`${item.id}-generic-option-${optionIndex}`} className="rounded-md border border-blue-100 bg-white px-2.5 py-1.5">
                  <span className="mr-2 text-xs font-semibold text-blue-700">{option.label}</span>
                  <span>{option.text}</span>
                </li>
              ))}
            </ul>
          )}

          {kind === "generic" && item.statements.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1 text-sm text-gray-700">
              {item.statements.map((statement, statementIndex) => (
                <li key={`${item.id}-generic-statement-${statementIndex}`}>
                  <span className="mr-1 font-semibold text-gray-600">
                    {statement.number != null ? `${statement.number}.` : "-"}
                  </span>
                  <span>{statement.text}</span>
                </li>
              ))}
            </ul>
          )}

          {kind === "generic" && item.blanks.length > 0 && (
            <div className="mt-2 rounded-md border border-blue-100 bg-white p-2 text-xs text-gray-700">
              <p className="font-semibold text-gray-800">Blanks</p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {item.blanks.map((blank) => (
                  <li key={`${item.id}-generic-blank-${blank.blankId}`}>
                    <span className="font-medium">#{blank.blankId}:</span> {blank.answer}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {item.solution && (
            <p className="mt-2 text-xs text-gray-600">
              <span className="font-semibold text-gray-800">Solution:</span> {item.solution}
            </p>
          )}

          {item.explanation && (
            <p className="mt-1 text-xs text-gray-600">
              <span className="font-semibold text-gray-800">Explanation:</span> {item.explanation}
            </p>
          )}
        </div>
      );
    }
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
