// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import StudyPage from "../pages/StudyPage";
import type { StudyPageData } from "../services/study";

const mockGetStudyPage = vi.fn();

vi.mock("../services/getStudyService", () => ({
  getStudyService: () => ({
    getStudyPage: mockGetStudyPage,
  }),
}));

vi.mock("../hooks/useNotes", () => ({
  useNotes: () => ({
    value: "",
    onChange: vi.fn(),
    status: "idle" as const,
  }),
}));

function renderStudyPage() {
  render(
    <MemoryRouter initialEntries={["/courses/12/study"]}>
      <Routes>
        <Route path="/courses/:id/study" element={<StudyPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("StudyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads study data and uses resume lesson as selected item", async () => {
    const data: StudyPageData = {
      courseTitle: "Linear Algebra",
      lessonCount: 2,
      totalMinutes: 45,
      groups: [
        {
          title: "Chapter 1",
          items: [
            { id: "lesson-1", label: "Vectors", status: "not_started" },
            { id: "lesson-2", label: "Matrices", status: "not_started" },
          ],
        },
      ],
      progressItems: [
        { id: "lesson-1", label: "Vectors", status: "not_started" },
        { id: "lesson-2", label: "Matrices", status: "practiced" },
      ],
      contentMap: {
        "lesson-1": { info: null, learning: null, goal: null, practiceCards: [] },
        "lesson-2": { info: null, learning: null, goal: null, practiceCards: [] },
      },
      lessonDbIdMap: {},
      resumeLessonId: "lesson-2",
      documents: [
        {
          documentId: "doc-1",
          documentName: "Main Document",
          groups: [
            {
              title: "Chapter 1",
              items: [
                { id: "lesson-1", label: "Vectors", status: "not_started" },
                { id: "lesson-2", label: "Matrices", status: "not_started" },
              ],
            },
          ],
          progressItems: [
            { id: "lesson-1", label: "Vectors", status: "not_started" },
            { id: "lesson-2", label: "Matrices", status: "practiced" },
          ],
          contentMap: {
            "lesson-1": { info: null, learning: null, goal: null, practiceCards: [] },
            "lesson-2": { info: null, learning: null, goal: null, practiceCards: [] },
          },
          lessonDbIdMap: {},
          resumeLessonId: "lesson-2",
        },
      ],
      selectedDocumentId: "doc-1",
    };

    mockGetStudyPage.mockResolvedValue(data);

    renderStudyPage();

    expect(await screen.findByRole("heading", { name: "Matrices" })).toBeInTheDocument();
  });

  it("shows error state when study service fails", async () => {
    mockGetStudyPage.mockRejectedValue(new Error("network down"));

    renderStudyPage();

    expect(await screen.findByText("Failed to load study page")).toBeInTheDocument();
    expect(screen.getByText("network down")).toBeInTheDocument();
  });
});
