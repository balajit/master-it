// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";

const mockUseAuth = vi.fn();

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../pages/Home", () => ({
  default: () => <div>HOME_PAGE</div>,
}));

vi.mock("../pages/UserManagement", () => ({
  default: () => <div>USERS_PAGE</div>,
}));

vi.mock("../pages/CourseManagementPage", () => ({
  default: () => <div>COURSE_MANAGEMENT_PAGE</div>,
}));

vi.mock("../pages/EditCoursePage", () => ({
  default: () => <div>EDIT_PAGE</div>,
}));

vi.mock("../pages/CourseDetailPage", () => ({
  default: () => <div>COURSE_DETAIL_PAGE</div>,
}));

vi.mock("../pages/StudyPage", () => ({
  default: () => <div>STUDY_PAGE</div>,
}));

function setPath(path: string) {
  window.history.pushState({}, "", path);
}

describe("App route guards", () => {
  it("redirects unauthenticated user away from /users", () => {
    setPath("/users");
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });

    render(<App />);

    expect(screen.getByText("HOME_PAGE")).toBeInTheDocument();
    expect(screen.queryByText("USERS_PAGE")).not.toBeInTheDocument();
  });

  it("allows admin user on /users", () => {
    setPath("/users");
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1,
        name: "Admin",
        email: "admin@example.com",
        avatarUrl: "",
        roles: [{ id: 1, name: "Administrator", permissions: [] }],
      },
    });

    render(<App />);

    expect(screen.getByText("USERS_PAGE")).toBeInTheDocument();
  });

  it("allows instructor user on /courses/manage", () => {
    setPath("/courses/manage");
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 2,
        name: "Instructor",
        email: "instructor@example.com",
        avatarUrl: "",
        roles: [{ id: 2, name: "Instructor", permissions: [] }],
      },
    });

    render(<App />);

    expect(screen.getByText("COURSE_MANAGEMENT_PAGE")).toBeInTheDocument();
  });
});
