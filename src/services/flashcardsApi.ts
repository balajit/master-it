import client from "../api/client";
import type { components } from "../api/v1.d.ts";

export type FlashcardResponse = components["schemas"]["FlashcardResponse"];

function formatApiError(prefix: string, error: unknown): string {
  if (!error || typeof error !== "object") return prefix;
  const detail = "detail" in error ? (error as { detail?: unknown }).detail : undefined;
  if (typeof detail === "string" && detail.trim().length > 0) {
    return `${prefix}: ${detail}`;
  }
  return `${prefix}: ${JSON.stringify(error)}`;
}

export async function getLessonFlashcards(lessonId: number): Promise<FlashcardResponse[]> {
  const { data, error } = await client.GET("/api/v1/lessons/{lesson_id}/flashcards", {
    params: { path: { lesson_id: lessonId } },
  });

  if (error || !data) {
    throw new Error(formatApiError("Failed to load flashcards", error));
  }

  return data;
}

export async function createLessonFlashcard(
  lessonId: number,
  front: string,
  back: string,
): Promise<FlashcardResponse> {
  const { data, error } = await client.POST("/api/v1/flashcards", {
    body: {
      front,
      back,
      scope: "user",
      lesson_id: lessonId,
    },
  });

  if (error || !data) {
    throw new Error(formatApiError("Failed to create flashcard", error));
  }

  return data;
}

export async function generateLessonFlashcards(
  lessonId: number,
  force = false,
): Promise<FlashcardResponse[]> {
  const { data, error } = await client.POST("/api/v1/flashcards/generate", {
    body: {
      scope: "lesson",
      target_id: lessonId,
      card_scope: "user",
      force,
    },
  });

  if (error || !data) {
    throw new Error(formatApiError("Failed to generate flashcards", error));
  }

  return data;
}

export async function deleteFlashcard(cardId: number): Promise<void> {
  const { error } = await client.DELETE("/api/v1/flashcards/{card_id}", {
    params: { path: { card_id: cardId } },
  });

  if (error) {
    throw new Error(formatApiError("Failed to delete flashcard", error));
  }
}

export async function updateFlashcard(
  cardId: number,
  front: string,
  back: string,
): Promise<FlashcardResponse> {
  const { data, error } = await client.PUT("/api/v1/flashcards/{card_id}", {
    params: { path: { card_id: cardId } },
    body: {
      front,
      back,
    },
  });

  if (error || !data) {
    throw new Error(formatApiError("Failed to update flashcard", error));
  }

  return data;
}
