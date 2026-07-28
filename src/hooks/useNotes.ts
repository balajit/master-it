/**
 * useNotes.ts — React hook for per-lesson note persistence.
 *
 * Fetches the current note when the lesson changes, exposes a controlled
 * value/onChange interface, and auto-saves with an 800ms debounce. The hook
 * reports save status so the UI can display "Saving…" / "Saved" feedback.
 *
 * Behaviour:
 *   - On lessonDbId change: fetch existing notes, populate value from the
 *     first note found (lesson has at most one note in practice).
 *   - On onChange: update local state immediately (optimistic) and schedule
 *     a debounced save. If a note already exists (noteId is tracked),
 *     updateNote is called; otherwise createLessonNote.
 *   - If lessonDbId is null (lesson not yet provisioned), the hook is a
 *     no-op: value is always "", onChange is a no-op, status is "idle".
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchLessonNotes,
  createLessonNote,
  updateNote,
} from "../services/notesApi";

export type NoteStatus = "idle" | "saving" | "saved" | "error";

interface UseNotesResult {
  value:    string;
  onChange: (text: string) => void;
  status:   NoteStatus;
}

const DEBOUNCE_MS = 800;

export function useNotes(lessonDbId: number | null): UseNotesResult {
  const [value,  setValue]  = useState<string>("");
  const [status, setStatus] = useState<NoteStatus>("idle");

  // Track the DB id of the note row so we can update rather than re-create.
  const noteIdRef = useRef<number | null>(null);

  // Debounce timer handle.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep a stable ref to the current lessonDbId to avoid stale closure issues
  // inside the debounced save.
  const lessonDbIdRef = useRef<number | null>(lessonDbId);
  useEffect(() => {
    lessonDbIdRef.current = lessonDbId;
  }, [lessonDbId]);

  // ── Fetch on lesson change ────────────────────────────────────────────────
  useEffect(() => {
    // Cancel any pending save from a previous lesson.
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (lessonDbId == null) {
      noteIdRef.current = null;
      return;
    }

    let cancelled = false;

    noteIdRef.current = null;

    fetchLessonNotes(lessonDbId).then((notes) => {
      if (cancelled) return;
      if (notes.length > 0) {
        const note = notes[0];
        setValue(note.content);
        noteIdRef.current = note.id;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [lessonDbId]);

  // ── Debounced save ────────────────────────────────────────────────────────
  const save = useCallback(async (text: string) => {
    const currentLessonId = lessonDbIdRef.current;
    if (currentLessonId == null) return;

    setStatus("saving");
    try {
      if (noteIdRef.current != null) {
        const updated = await updateNote(noteIdRef.current, text);
        noteIdRef.current = updated.id;
      } else {
        const created = await createLessonNote(currentLessonId, text);
        noteIdRef.current = created.id;
      }
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, []);

  // ── onChange handler ──────────────────────────────────────────────────────
  const onChange = useCallback(
    (text: string) => {
      setValue(text);

      if (lessonDbIdRef.current == null) return;

      setStatus("saving");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        save(text);
      }, DEBOUNCE_MS);
    },
    [save],
  );

  return {
    value: lessonDbId == null ? "" : value,
    onChange,
    status: lessonDbId == null ? "idle" : status,
  };
}
