// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import CourseCatalog from "../components/CourseCatalog";

vi.mock("../api/client", () => {
  const mockClient = {
    GET: vi.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          title: "Existing Course",
          description: "Already here",
          number_of_credits: 3,
          difficulty: "beginner",
          status: "OPEN",
          owner_id: 0,
        },
      ],
      error: undefined,
    }),
    POST: vi.fn().mockResolvedValue({ data: { id: 2 }, error: undefined }),
    DELETE: vi.fn().mockResolvedValue({ data: undefined, error: undefined }),
  };
  return { default: mockClient, setAuthToken: vi.fn() };
});

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

vi.mock("../components/auth/AuthModal", () => ({
  default: () => null,
}));

describe("CourseCatalog new course visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a new course passed via onCourseAdded prop", async () => {
    const newCourse = {
      id: 2,
      title: "Brand New Course",
      description: "Just added",
      number_of_credits: 4,
      difficulty: "advanced",
      status: "OPEN" as const,
      owner_id: 0,
    };

    render(
      <MemoryRouter>
        <CourseCatalog onCourseAdded={newCourse} />
      </MemoryRouter>,
    );

    await screen.findByText("Existing Course");

    expect(screen.getByText("Brand New Course")).toBeInTheDocument();
  });

  it("does NOT show the new course before the callback fires", async () => {
    render(
      <MemoryRouter>
        <CourseCatalog />
      </MemoryRouter>,
    );

    await screen.findByText("Existing Course");

    expect(screen.queryByText("Brand New Course")).not.toBeInTheDocument();
  });
});
