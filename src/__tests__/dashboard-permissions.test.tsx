// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Dashboard from "../components/Dashboard";
import type { User } from "../context/auth-context";
import { hasPermission, hasRole } from "../context/auth-context";

vi.mock("../api/client", () => {
  const mockClient = {
    GET: vi.fn().mockResolvedValue({ data: [], error: undefined }),
    POST: vi.fn().mockResolvedValue({ data: {}, error: undefined }),
    DELETE: vi.fn().mockResolvedValue({ data: undefined, error: undefined }),
  };
  return { default: mockClient, setAuthToken: vi.fn() };
});

const mockUseAuth = vi.fn();

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../components/AddCourse", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="add-course-modal">Add Course Modal</div> : null,
}));

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    avatarUrl: "",
    roles: [],
    ...overrides,
  };
}

describe("Dashboard permission gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hides Add course button when user has no course:create permission", () => {
    mockUseAuth.mockReturnValue({
      user: makeUser({ roles: [{ id: 1, name: "Student", permissions: [] }] }),
    });

    render(<MemoryRouter><Dashboard onCourseAdded={vi.fn()} /></MemoryRouter>);

    expect(screen.queryByText("Add course")).not.toBeInTheDocument();
  });

  it("hides Add course button when user is null", () => {
    mockUseAuth.mockReturnValue({ user: null });

    render(<MemoryRouter><Dashboard onCourseAdded={vi.fn()} /></MemoryRouter>);

    expect(screen.queryByText("Add course")).not.toBeInTheDocument();
  });

  it("shows Add course button when user has course:create permission", () => {
    mockUseAuth.mockReturnValue({
      user: makeUser({
        roles: [
          {
            id: 1,
            name: "Instructor",
            permissions: [{ id: 1, name: "course:create" }],
          },
        ],
      }),
    });

    render(<MemoryRouter><Dashboard onCourseAdded={vi.fn()} /></MemoryRouter>);

    expect(screen.getByText("Add course")).toBeInTheDocument();
  });

  it("shows Add course button when user has wildcard * permission", () => {
    mockUseAuth.mockReturnValue({
      user: makeUser({
        roles: [
          {
            id: 1,
            name: "SuperUser",
            permissions: [{ id: 1, name: "*" }],
          },
        ],
      }),
    });

    render(<MemoryRouter><Dashboard onCourseAdded={vi.fn()} /></MemoryRouter>);

    expect(screen.getByText("Add course")).toBeInTheDocument();
  });

  it("shows welcome message with user name", () => {
    mockUseAuth.mockReturnValue({
      user: makeUser({ name: "Jane Doe" }),
    });

    render(<MemoryRouter><Dashboard onCourseAdded={vi.fn()} /></MemoryRouter>);

    expect(screen.getByText(/Welcome back, Jane!/)).toBeInTheDocument();
  });
});

describe("hasPermission / hasRole with stale sessions", () => {
  it("does not crash when user.roles is undefined (stale localStorage session)", () => {
    const staleUser = {
      id: 1,
      name: "Old User",
      email: "old@example.com",
      avatarUrl: "",
    } as unknown as User;

    expect(() => hasPermission(staleUser, "course:create")).not.toThrow();
    expect(hasPermission(staleUser, "course:create")).toBe(false);
  });

  it("does not crash when hasRole is called with undefined roles", () => {
    const staleUser = {
      id: 1,
      name: "Old User",
      email: "old@example.com",
      avatarUrl: "",
    } as unknown as User;

    expect(() => hasRole(staleUser, "Administrator")).not.toThrow();
    expect(hasRole(staleUser, "Administrator")).toBe(false);
  });

  it("still works correctly for users with roles", () => {
    const user = makeUser({
      roles: [
        {
          id: 1,
          name: "Administrator",
          permissions: [{ id: 1, name: "*" }],
        },
      ],
    });

    expect(hasPermission(user, "course:create")).toBe(true);
    expect(hasRole(user, "Administrator")).toBe(true);
    expect(hasRole(user, "Student")).toBe(false);
  });
});
