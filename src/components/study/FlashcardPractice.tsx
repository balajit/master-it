import { useEffect, useMemo, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import Button from "./ui/Button";
import type { FlashcardResponse } from "../../services/flashcardsApi";

function listClassName(base: string, childCount: number): string {
  const foldClass = childCount >= 8
    ? "md:columns-2 md:gap-8 md:[&>li]:break-inside-avoid"
    : "";
  return `${base} ${foldClass}`.trim();
}

function parseMarkdownListItems(markdown: string): string[] {
  const lines = markdown.split(/\r?\n/);
  const listPattern = /^\s*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?(.+?)\s*$/;

  return lines
    .map((line) => line.match(listPattern)?.[1]?.trim() ?? "")
    .filter(Boolean);
}

const MARKDOWN_COMPONENTS = {
  ul: (props: React.ComponentProps<"ul">) => {
    const childCount = Array.isArray(props.children) ? props.children.length : 1;
    return (
      <ul
        {...props}
        className={listClassName("list-disc space-y-1 pl-6 text-left", childCount)}
      />
    );
  },
  ol: (props: React.ComponentProps<"ol">) => {
    const childCount = Array.isArray(props.children) ? props.children.length : 1;
    return (
      <ol
        {...props}
        className={listClassName("list-decimal space-y-1 pl-6 text-left", childCount)}
      />
    );
  },
  li: (props: React.ComponentProps<"li">) => (
    <li className="leading-relaxed" {...props} />
  ),
  p: (props: React.ComponentProps<"p">) => (
    <p className="leading-relaxed" {...props} />
  ),
};

interface FlashcardPracticeProps {
  cards: FlashcardResponse[];
  loading: boolean;
  error: string | null;
  lessonId: number | null;
  onRefresh: () => void;
  onCreate: (front: string, back: string) => Promise<void>;
  onGenerate: (force?: boolean) => Promise<void>;
  onDelete: (cardId: number) => Promise<void>;
  onUpdate: (cardId: number, front: string, back: string) => Promise<void>;
}

type BackMode = "paragraph" | "list";

function shuffleCards<T>(items: T[]): T[] {
  if (items.length <= 1) return [...items];

  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  if (shuffled.every((item, idx) => item === items[idx])) {
    const retry = [...shuffled];
    const last = retry.length - 1;
    [retry[0], retry[last]] = [retry[last], retry[0]];
    return retry;
  }

  return shuffled;
}

export default function FlashcardPractice({
  cards,
  loading,
  error,
  lessonId,
  onRefresh,
  onCreate,
  onGenerate,
  onDelete,
  onUpdate,
}: FlashcardPracticeProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [backMode, setBackMode] = useState<BackMode>("paragraph");
  const [listItems, setListItems] = useState<string[]>([""]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [generateBusy, setGenerateBusy] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<number | null>(null);
  const [deleteConfirmCardId, setDeleteConfirmCardId] = useState<number | null>(null);

  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editBackMode, setEditBackMode] = useState<BackMode>("paragraph");
  const [editListItems, setEditListItems] = useState<string[]>([""]);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  const [hiddenCardIds, setHiddenCardIds] = useState<Record<number, boolean>>({});

  const filteredBaseCards = useMemo(() => {
    return cards.filter((card) => !hiddenCardIds[card.id]);
  }, [cards, hiddenCardIds]);

  const [deckCards, setDeckCards] = useState<FlashcardResponse[]>(filteredBaseCards);

  useEffect(() => {
    setDeckCards(filteredBaseCards);
  }, [filteredBaseCards]);

  const hasCards = deckCards.length > 0;
  const deckSize = hasCards ? deckCards.length + 1 : 0;
  const isEndCard = hasCards && activeIndex === deckCards.length;

  useEffect(() => {
    setActiveIndex(0);
    setIsFlipped(false);
    setEditingCardId(null);
    setEditFront("");
    setEditBack("");
    setEditBackMode("paragraph");
    setEditListItems([""]);
    setEditError(null);
    setHiddenCardIds({});
    setDeleteConfirmCardId(null);
    setCollapsed(true);
  }, [lessonId]);

  useEffect(() => {
    if (!hasCards) {
      setActiveIndex(0);
      setIsFlipped(false);
      return;
    }
    if (activeIndex >= deckSize) {
      setActiveIndex(0);
      setIsFlipped(false);
    }
  }, [activeIndex, deckSize, hasCards]);

  const activeCard = isEndCard ? null : (deckCards[activeIndex] ?? null);
  const currentDeckPosition = hasCards ? (isEndCard ? deckCards.length : activeIndex + 1) : 0;

  async function handleCreate() {
    const trimmedFront = front.trim();
    const trimmedBack = backMode === "list"
      ? listItems.map((item) => item.trim()).filter(Boolean).map((item) => `- ${item}`).join("\n")
      : back.trim();
    if (!trimmedFront || !trimmedBack) {
      setCreateError("Front and back are required.");
      return;
    }

    setCreateBusy(true);
    setCreateError(null);
    try {
      await onCreate(trimmedFront, trimmedBack);
      setFront("");
      setBack("");
      setBackMode("paragraph");
      setListItems([""]);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create flashcard");
    } finally {
      setCreateBusy(false);
    }
  }

  async function handleGenerate(force = false) {
    setGenerateBusy(true);
    try {
      await onGenerate(force);
      setIsFlipped(false);
    } finally {
      setGenerateBusy(false);
    }
  }

  async function handleDelete(cardId: number) {
    setDeleteBusyId(cardId);
    try {
      await onDelete(cardId);
      setIsFlipped(false);
      setEditingCardId(null);
      setDeleteConfirmCardId(null);
    } finally {
      setDeleteBusyId(null);
    }
  }

  function beginEdit(card: FlashcardResponse) {
    const parsedListItems = parseMarkdownListItems(card.back);
    setEditingCardId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
    if (parsedListItems.length > 0) {
      setEditBackMode("list");
      setEditListItems(parsedListItems);
    } else {
      setEditBackMode("paragraph");
      setEditListItems([""]);
    }
    setEditError(null);
  }

  function switchEditBackMode(nextMode: BackMode) {
    setEditBackMode(nextMode);

    if (nextMode === "list") {
      const parsed = parseMarkdownListItems(editBack);
      if (parsed.length > 0) {
        setEditListItems(parsed);
      } else if (editListItems.length === 0) {
        setEditListItems([""]);
      }
    }
  }

  function cancelEdit() {
    setEditingCardId(null);
    setEditFront("");
    setEditBack("");
    setEditBackMode("paragraph");
    setEditListItems([""]);
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (editingCardId == null) return;
    const trimmedFront = editFront.trim();
    const trimmedBack = editBackMode === "list"
      ? editListItems.map((item) => item.trim()).filter(Boolean).map((item) => `- ${item}`).join("\n")
      : editBack.trim();
    if (!trimmedFront || !trimmedBack) {
      setEditError("Front and back are required.");
      return;
    }

    setEditBusy(true);
    setEditError(null);
    try {
      await onUpdate(editingCardId, trimmedFront, trimmedBack);
      cancelEdit();
      setIsFlipped(false);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update flashcard");
    } finally {
      setEditBusy(false);
    }
  }

  function goPrevious() {
    if (!hasCards) return;
    setActiveIndex((prev) => (prev - 1 + deckSize) % deckSize);
    setIsFlipped(false);
    cancelEdit();
    setDeleteConfirmCardId(null);
  }

  function goNext() {
    if (!hasCards) return;

    if (isEndCard) {
      setDeckCards((prev) => shuffleCards(prev));
      setActiveIndex(0);
    } else {
      setActiveIndex((prev) => prev + 1);
    }

    setIsFlipped(false);
    cancelEdit();
    setDeleteConfirmCardId(null);
  }

  function restartFromEndCard() {
    if (!isEndCard || !hasCards) return;
    setDeckCards((prev) => shuffleCards(prev));
    setActiveIndex(0);
    setIsFlipped(false);
    cancelEdit();
    setDeleteConfirmCardId(null);
  }

  function resetFocusFilters() {
    setHiddenCardIds({});
    setActiveIndex(0);
    setIsFlipped(false);
    cancelEdit();
    setDeleteConfirmCardId(null);
  }

  function toggleHideCard(cardId: number) {
    setHiddenCardIds((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
    setIsFlipped(false);
    cancelEdit();
    setDeleteConfirmCardId(null);
  }

  const isEditingActiveCard = activeCard != null && editingCardId === activeCard.id;
  const hiddenCount = Object.values(hiddenCardIds).filter(Boolean).length;
  const allHidden = cards.length > 0 && filteredBaseCards.length === 0;
  const summaryText = cards.length === 0
    ? "No flashcards yet"
    : `${deckCards.length} available of ${cards.length}${hiddenCount > 0 ? ` · ${hiddenCount} hidden` : ""}`;

  return (
    <section className={`rounded-2xl bg-white shadow-sm ring-1 ring-black/5 ${collapsed ? "p-3 sm:p-3.5" : "p-5 sm:p-6"}`}>
      <div
        className="flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-lg"
        onClick={() => setCollapsed((prev) => !prev)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setCollapsed((prev) => !prev);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand flashcard practice" : "Collapse flashcard practice"}
      >
        <div>
          <h3 className="text-base font-semibold text-gray-900">Flashcard Practice</h3>
          {!collapsed && (
            <p className="mt-1 text-xs text-gray-500">
              Build, generate, and study lesson-scoped flipcards.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600">
            {summaryText}
          </span>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading || lessonId == null}>
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void handleGenerate(false);
              }}
              disabled={loading || generateBusy || lessonId == null}
            >
              Generate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void handleGenerate(true);
              }}
              disabled={loading || generateBusy || lessonId == null}
            >
              Regenerate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFocusFilters}
              disabled={hiddenCount === 0}
              title="Reset hidden cards"
              aria-label="Reset hidden cards"
            >
              <span className="inline-flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 1 1-9.39-5.246.75.75 0 0 1 1.06 1.06A4 4 0 1 0 13.811 11H11.75a.75.75 0 0 1 0-1.5h3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-2.326Z" clipRule="evenodd" />
                </svg>
                {hiddenCount > 0 ? `${hiddenCount}` : ""}
              </span>
            </Button>
          </div>

      {lessonId == null && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Flashcards are unavailable for this lesson because it is missing a backend lesson_id.
        </p>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-medium text-gray-600">
              <span>Deck {currentDeckPosition} / {deckCards.length}</span>
              {hiddenCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">
                  +{hiddenCount}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l13 13a.75.75 0 0 0 1.06-1.06l-1.494-1.494a10.743 10.743 0 0 0 2.065-2.838.75.75 0 0 0 0-.676A10.77 10.77 0 0 0 10 4.5c-1.45 0-2.833.285-4.096.8L3.53 2.47Z" />
                    <path d="M10 6a4 4 0 0 1 3.937 3.29l-1.673-1.672a2.5 2.5 0 0 0-3.146-3.146L7.446 2.8A10.742 10.742 0 0 1 10 2.5a10.77 10.77 0 0 1 7.1 6.962.75.75 0 0 1 0 .676 10.744 10.744 0 0 1-2.065 2.838l-1.51-1.51A4 4 0 0 1 10 6Z" />
                    <path d="M9.282 6.16 11.84 8.72a2.5 2.5 0 0 1-3.12 3.12l-2.56-2.56a4 4 0 0 0 3.122 3.122l1.604 1.604A5.5 5.5 0 0 1 6 8.718L9.282 6.16Z" />
                  </svg>
                </span>
              )}
            </p>
            {loading && <p className="text-xs text-gray-400">Loading…</p>}
          </div>

          {error && (
            <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
              {error}
            </p>
          )}

          {activeCard ? (
            <div className="space-y-3">
              {isEditingActiveCard ? (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                    Edit flashcard
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Front
                      </label>
                      <textarea
                        value={editFront}
                        onChange={(event) => setEditFront(event.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-amber-200 bg-white px-2.5 py-2 text-sm text-gray-900 focus:border-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1"
                        disabled={editBusy}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Back (Markdown)
                      </label>

                      <div className="mb-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => switchEditBackMode("paragraph")}
                          disabled={editBusy}
                          className={`rounded-md border px-2 py-1 text-[11px] font-medium ${
                            editBackMode === "paragraph"
                              ? "border-amber-300 bg-amber-100 text-amber-700"
                              : "border-amber-200 bg-white text-gray-600 hover:bg-amber-50"
                          }`}
                        >
                          Paragraph
                        </button>
                        <button
                          type="button"
                          onClick={() => switchEditBackMode("list")}
                          disabled={editBusy}
                          className={`rounded-md border px-2 py-1 text-[11px] font-medium ${
                            editBackMode === "list"
                              ? "border-amber-300 bg-amber-100 text-amber-700"
                              : "border-amber-200 bg-white text-gray-600 hover:bg-amber-50"
                          }`}
                        >
                          List
                        </button>
                      </div>

                      {editBackMode === "paragraph" ? (
                        <textarea
                          value={editBack}
                          onChange={(event) => setEditBack(event.target.value)}
                          rows={5}
                          className="w-full rounded-lg border border-amber-200 bg-white px-2.5 py-2 text-sm text-gray-900 focus:border-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1"
                          disabled={editBusy}
                        />
                      ) : (
                        <div className="space-y-2">
                          {editListItems.map((item, itemIndex) => (
                            <div key={`edit-list-item-${itemIndex}`} className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">-</span>
                              <input
                                type="text"
                                value={item}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setEditListItems((prev) => prev.map((entry, idx) => (idx === itemIndex ? value : entry)));
                                }}
                                className="w-full rounded-lg border border-amber-200 bg-white px-2.5 py-2 text-sm text-gray-900 focus:border-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1"
                                disabled={editBusy}
                              />
                              {editListItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setEditListItems((prev) => prev.filter((_, idx) => idx !== itemIndex))}
                                  disabled={editBusy}
                                  className="rounded-md border border-amber-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-amber-50"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => setEditListItems((prev) => [...prev, ""])}
                            disabled={editBusy}
                            className="rounded-md border border-dashed border-amber-300 px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-100"
                          >
                            Add item
                          </button>
                        </div>
                      )}
                    </div>

                    {editError && (
                      <p className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
                        {editError}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          void handleSaveEdit();
                        }}
                        disabled={editBusy}
                      >
                        {editBusy ? "Saving…" : "Save"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={editBusy}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        beginEdit(activeCard);
                      }}
                      disabled={editBusy || deleteBusyId === activeCard.id}
                      className="rounded-md border border-white/70 bg-white/85 p-1.5 text-gray-700 backdrop-blur transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      title="Edit card"
                      aria-label="Edit card"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M2.695 14.763l-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.5a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343Z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteConfirmCardId((prev) =>
                          prev === activeCard.id ? null : activeCard.id,
                        );
                      }}
                      disabled={deleteBusyId === activeCard.id || editBusy}
                      className="rounded-md border border-white/70 bg-white/85 p-1.5 text-red-700 backdrop-blur transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      title="Delete card"
                      aria-label="Delete card"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleHideCard(activeCard.id);
                      }}
                      className="rounded-md border border-white/70 bg-white/85 p-1.5 text-gray-700 backdrop-blur transition-colors hover:bg-white"
                      title={hiddenCardIds[activeCard.id] ? "Unhide card" : "Hide card"}
                      aria-label={hiddenCardIds[activeCard.id] ? "Unhide card" : "Hide card"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l13 13a.75.75 0 0 0 1.06-1.06l-1.494-1.494a10.743 10.743 0 0 0 2.065-2.838.75.75 0 0 0 0-.676A10.77 10.77 0 0 0 10 4.5c-1.45 0-2.833.285-4.096.8L3.53 2.47Z" />
                        <path d="M10 6a4 4 0 0 1 3.937 3.29l-1.673-1.672a2.5 2.5 0 0 0-3.146-3.146L7.446 2.8A10.742 10.742 0 0 1 10 2.5a10.77 10.77 0 0 1 7.1 6.962.75.75 0 0 1 0 .676 10.744 10.744 0 0 1-2.065 2.838l-1.51-1.51A4 4 0 0 1 10 6Z" />
                        <path d="M9.282 6.16 11.84 8.72a2.5 2.5 0 0 1-3.12 3.12l-2.56-2.56a4 4 0 0 0 3.122 3.122l1.604 1.604A5.5 5.5 0 0 1 6 8.718L9.282 6.16Z" />
                      </svg>
                    </button>
                  </div>
                  {deleteConfirmCardId === activeCard.id && (
                    <div
                      className="absolute right-3 top-12 z-20 w-52 rounded-lg border border-red-200 bg-white p-2 shadow-lg"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <p className="text-[11px] leading-snug text-gray-700">
                        Delete this flashcard? This cannot be undone.
                      </p>
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmCardId(null)}
                          className="rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void handleDelete(activeCard.id);
                          }}
                          disabled={deleteBusyId === activeCard.id}
                          className="rounded-md bg-red-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {deleteBusyId === activeCard.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsFlipped((prev) => !prev)}
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${
                      isFlipped
                        ? "border-emerald-200 bg-emerald-50 text-emerald-950 hover:border-emerald-300"
                        : "border-indigo-200 bg-indigo-50 text-indigo-950 hover:border-indigo-300"
                    }`}
                  >
                    {isFlipped ? (
                      <div className="flex h-72 items-center justify-center">
                        <div className="prose prose-sm max-h-full w-full overflow-y-auto text-emerald-950">
                          <Markdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeSanitize]}
                            components={MARKDOWN_COMPONENTS}
                          >
                            {activeCard.back}
                          </Markdown>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-72 items-center justify-center">
                        <h2 className="text-center text-2xl font-semibold tracking-tight text-indigo-900">
                          {activeCard.front}
                        </h2>
                      </div>
                    )}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500" />
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={goPrevious} disabled={!hasCards}>
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goNext}
                    disabled={!hasCards}
                  >
                    Next
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFocusFilters}
                    disabled={hiddenCount === 0}
                    title="Reset hidden cards"
                    aria-label="Reset hidden cards"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 1 1-9.39-5.246.75.75 0 0 1 1.06 1.06A4 4 0 1 0 13.811 11H11.75a.75.75 0 0 1 0-1.5h3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-2.326Z" clipRule="evenodd" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          ) : isEndCard ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={restartFromEndCard}
                className="flex h-[20rem] w-full flex-col items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-6 text-center transition-colors hover:border-violet-300 hover:bg-violet-100"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600">
                  End of Deck
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-violet-900">
                  Nice work.
                </h2>
              </button>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500" />
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={goPrevious} disabled={!hasCards}>
                    Previous
                  </Button>
                  <Button variant="ghost" size="sm" onClick={goNext} disabled={!hasCards}>
                    Next
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFocusFilters}
                    disabled={hiddenCount === 0}
                    title="Reset hidden cards"
                    aria-label="Reset hidden cards"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 1 1-9.39-5.246.75.75 0 0 1 1.06 1.06A4 4 0 1 0 13.811 11H11.75a.75.75 0 0 1 0-1.5h3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-2.326Z" clipRule="evenodd" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          ) : allHidden ? (
            <div className="space-y-2 rounded-lg border border-dashed border-gray-200 bg-white px-3 py-4 text-xs text-gray-500">
              <p>All cards are hidden right now. Unhide cards or reset to include everything.</p>
              <button
                type="button"
                onClick={resetFocusFilters}
                className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100"
              >
                Reset hidden cards (include all)
              </button>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-4 text-xs text-gray-500">
              No flashcards yet for this lesson.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-gray-900">Add a Flashcard</h4>
          <p className="mt-1 text-xs text-gray-500">Create a manual front/back card. Back supports Markdown.</p>

          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Front
              </label>
              <textarea
                value={front}
                onChange={(event) => setFront(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-1"
                placeholder="Prompt, question, or term"
                disabled={lessonId == null || createBusy}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Back
              </label>

              <div className="mb-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBackMode("paragraph")}
                  disabled={lessonId == null || createBusy}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium ${
                    backMode === "paragraph"
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Paragraph
                </button>
                <button
                  type="button"
                  onClick={() => setBackMode("list")}
                  disabled={lessonId == null || createBusy}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium ${
                    backMode === "list"
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  List
                </button>
              </div>

              {backMode === "paragraph" ? (
                <textarea
                  value={back}
                  onChange={(event) => setBack(event.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-1"
                  placeholder="Supports Markdown: **bold**, *italic*, lists, etc."
                  disabled={lessonId == null || createBusy}
                />
              ) : (
                <div className="space-y-2">
                  {listItems.map((item, itemIndex) => (
                    <div key={`list-item-${itemIndex}`} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">-</span>
                      <input
                        type="text"
                        value={item}
                        onChange={(event) => {
                          const value = event.target.value;
                          setListItems((prev) => prev.map((entry, idx) => (idx === itemIndex ? value : entry)));
                        }}
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-1"
                        placeholder={`List item ${itemIndex + 1}`}
                        disabled={lessonId == null || createBusy}
                      />
                      {listItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setListItems((prev) => prev.filter((_, idx) => idx !== itemIndex))}
                          disabled={lessonId == null || createBusy}
                          className="rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setListItems((prev) => [...prev, ""])}
                    disabled={lessonId == null || createBusy}
                    className="rounded-md border border-dashed border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Add item
                  </button>
                </div>
              )}
            </div>

            {createError && (
              <p className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
                {createError}
              </p>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                void handleCreate();
              }}
              disabled={lessonId == null || createBusy}
              fullWidth
            >
              {createBusy ? "Creating…" : "Create Flashcard"}
            </Button>
          </div>
        </div>
      </div>
        </>
      )}
    </section>
  );
}
