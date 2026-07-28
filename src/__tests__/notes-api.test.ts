import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchLessonNotes,
  createLessonNote,
  updateNote,
} from "../services/notesApi";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();

vi.mock("../api/client", () => ({
  default: {
    GET: (...args: unknown[]) => mockGet(...args),
    POST: (...args: unknown[]) => mockPost(...args),
    PUT: (...args: unknown[]) => mockPut(...args),
  },
}));

describe("notesApi error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty list when fetchLessonNotes fails", async () => {
    mockGet.mockResolvedValue({ data: undefined, error: { message: "boom" } });

    await expect(fetchLessonNotes(5)).resolves.toEqual([]);
  });

  it("throws when createLessonNote fails", async () => {
    mockPost.mockResolvedValue({ data: undefined, error: { message: "create fail" } });

    await expect(createLessonNote(5, "hello")).rejects.toThrow("Failed to create note");
  });

  it("throws when updateNote fails", async () => {
    mockPut.mockResolvedValue({ data: undefined, error: { message: "update fail" } });

    await expect(updateNote(3, "updated")).rejects.toThrow("Failed to update note");
  });
});
