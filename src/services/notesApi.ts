/**
 * notesApi.ts — Typed API calls for the notes endpoints.
 *
 * All endpoints are under /api/v1/ and require a Bearer token (injected by
 * the openapi-fetch client automatically).
 *
 * Backend constraint: NoteCreate requires exactly one of unit_id or lesson_id.
 * This module exposes separate helpers for each scope to enforce that at the
 * call site.
 */

import client from "../api/client";
import type { components } from "../api/v1.d.ts";

export type NoteResponse = components["schemas"]["NoteResponse"];

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Fetch all notes for a specific lesson. Returns an empty array on error.
 */
export async function fetchLessonNotes(lessonId: string): Promise<NoteResponse[]> {
  const { data, error } = await client.GET("/api/v1/lessons/{lesson_id}/notes", {
    params: { path: { lesson_id: lessonId } },
  });

  if (error || !data) return [];
  return data;
}

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * Create a lesson-scoped note. Throws if the request fails.
 */
export async function createLessonNote(
  lessonId: string,
  content: string,
): Promise<NoteResponse> {
  const { data, error } = await client.POST("/api/v1/notes", {
    body: { content, lesson_id: lessonId },
  });

  if (error || !data) {
    throw new Error(`Failed to create note: ${JSON.stringify(error)}`);
  }
  return data;
}

// ── Update ────────────────────────────────────────────────────────────────────

/**
 * Update an existing note by its DB integer id. Throws if the request fails.
 */
export async function updateNote(
  noteId: string,
  content: string,
): Promise<NoteResponse> {
  const { data, error } = await client.PUT("/api/v1/notes/{note_id}", {
    params: { path: { note_id: noteId } },
    body:   { content },
  });

  if (error || !data) {
    throw new Error(`Failed to update note: ${JSON.stringify(error)}`);
  }
  return data;
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Delete a note by its DB integer id. Silently ignores 404.
 */
export async function deleteNote(noteId: string): Promise<void> {
  await client.DELETE("/api/v1/notes/{note_id}", {
    params: { path: { note_id: noteId } },
  });
}
