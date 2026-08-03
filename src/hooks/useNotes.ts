/**
 * useNotes.ts — React hook for per-lesson note persistence.
 *
 * Fetches the current note when the lesson changes, exposes a controlled
 * value/onChange interface, and auto-saves with an 800ms debounce. The hook
 * reports save status so the UI can display "Saving…" / "Saved" feedback.
 *
 * Behaviour:
 *   - On lessonId change: fetch existing notes, populate value from the
 *     first note found (lesson has at most one note in practice).
 *   - On onChange: update local state immediately (optimistic) and schedule
 *     a debounced save. If a note already exists (noteId is tracked),
 *     updateNote is called; otherwise createLessonNote.
 *   - If lessonId is null (lesson not yet provisioned), the hook is a
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
  onBlur:   () => void;
  onSave:   () => Promise<void>;
  dirty:    boolean;
  status:   NoteStatus;
}

const DEBOUNCE_MS = 800;

export function useNotes(lessonKey: string | null, lessonId: number | null): UseNotesResult {
  const [value,  setValue]  = useState<string>("");
  const [dirty, setDirty] = useState<boolean>(false);
  const [status, setStatus] = useState<NoteStatus>("idle");

  // Track the DB id of the note row so we can update rather than re-create.
  const noteIdRef = useRef<number | null>(null);
  const noteLessonIdRef = useRef<number | null>(null);
  const latestValueRef = useRef<string>("");
  const dirtyRef = useRef<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lessonIdRef = useRef<number | null>(lessonId);
  const lessonKeyRef = useRef<string | null>(lessonKey);

  const clearPendingSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const persistForLesson = useCallback(async (targetLessonId: number, text: string) => {
    setStatus("saving");
    try {
      const canUpdateExisting =
        noteIdRef.current != null && noteLessonIdRef.current === targetLessonId;

      if (canUpdateExisting) {
        const existingNoteId = noteIdRef.current;
        if (existingNoteId == null) return;
        const updated = await updateNote(existingNoteId, text);
        noteIdRef.current = updated.id;
        noteLessonIdRef.current = targetLessonId;
      } else {
        const created = await createLessonNote(targetLessonId, text);
        noteIdRef.current = created.id;
        noteLessonIdRef.current = targetLessonId;
      }

      if (lessonIdRef.current === targetLessonId) {
        setDirty(false);
        dirtyRef.current = false;
      }
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, []);

  // ── Fetch/reset on lesson change ──────────────────────────────────────────
  useEffect(() => {
    const previousLessonKey = lessonKeyRef.current;
    const previousLessonId = lessonIdRef.current;
    if (
      previousLessonKey != null
      && previousLessonKey !== lessonKey
      &&
      previousLessonId != null
      && dirtyRef.current
    ) {
      void persistForLesson(previousLessonId, latestValueRef.current);
    }

    clearPendingSave();
    lessonKeyRef.current = lessonKey;
    lessonIdRef.current = lessonId;

    if (lessonId == null) {
      noteIdRef.current = null;
      noteLessonIdRef.current = null;
      latestValueRef.current = "";
      dirtyRef.current = false;
      setValue("");
      setDirty(false);
      setStatus("idle");
      return;
    }

    let cancelled = false;

    noteIdRef.current = null;
    noteLessonIdRef.current = null;
    latestValueRef.current = "";
    dirtyRef.current = false;
    setValue("");
    setDirty(false);
    setStatus("idle");

    fetchLessonNotes(lessonId).then((notes) => {
      if (cancelled || lessonIdRef.current !== lessonId) return;
      if (notes.length > 0) {
        const note = notes[0];
        setValue(note.content);
        latestValueRef.current = note.content;
        noteIdRef.current = note.id;
        noteLessonIdRef.current = lessonId;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [lessonKey, lessonId, clearPendingSave, persistForLesson]);

  // ── onChange handler ──────────────────────────────────────────────────────
  const onChange = useCallback(
    (text: string) => {
      setValue(text);
      latestValueRef.current = text;

      setDirty(true);
      dirtyRef.current = true;
      setStatus("idle");

      if (lessonIdRef.current == null) return;

      clearPendingSave();
      timerRef.current = setTimeout(() => {
        const currentLessonId = lessonIdRef.current;
        if (currentLessonId == null) return;
        void persistForLesson(currentLessonId, text);
      }, DEBOUNCE_MS);
    },
    [clearPendingSave, persistForLesson],
  );

  const onSave = useCallback(async () => {
    clearPendingSave();
    const currentLessonId = lessonIdRef.current;
    if (currentLessonId == null) {
      setStatus("error");
      return;
    }
    await persistForLesson(currentLessonId, latestValueRef.current);
  }, [clearPendingSave, persistForLesson]);

  const onBlur = useCallback(() => {
    void onSave();
  }, [onSave]);

  useEffect(() => {
    return () => {
      clearPendingSave();
      const currentLessonId = lessonIdRef.current;
      if (currentLessonId != null && dirtyRef.current) {
        void persistForLesson(currentLessonId, latestValueRef.current);
      }
    };
  }, [clearPendingSave, persistForLesson]);

  return {
    value,
    onChange,
    onBlur,
    onSave,
    dirty,
    status,
  };
}
