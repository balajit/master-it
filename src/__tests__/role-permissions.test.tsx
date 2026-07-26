// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RolePermissions from "../components/RolePermissions";
import type { components } from "../api/v1.d.ts";

type Role = components["schemas"]["Role"];
type Permission = components["schemas"]["Permission"];

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockDelete = vi.fn();

vi.mock("../api/client", () => ({
  default: {
    GET: (...args: unknown[]) => mockGet(...args),
    POST: (...args: unknown[]) => mockPost(...args),
    DELETE: (...args: unknown[]) => mockDelete(...args),
  },
  setAuthToken: vi.fn(),
}));

const allPermissions: Permission[] = [
  { id: 1, name: "course:create" },
  { id: 2, name: "course:delete" },
  { id: 3, name: "user:manage" },
  { id: 4, name: "role:manage" },
];

const roles: Role[] = [
  {
    id: 1,
    name: "Administrator",
    permissions: [allPermissions[0], allPermissions[1]],
  },
  {
    id: 2,
    name: "Student",
    permissions: [],
  },
];

function setup() {
  mockGet.mockResolvedValue({ data: allPermissions, error: undefined });
  mockPost.mockResolvedValue({ data: {}, error: undefined });
  mockDelete.mockResolvedValue({ data: undefined, error: undefined });
}

describe("RolePermissions", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
    setup();
  });

  it("renders role buttons", async () => {
    render(<RolePermissions roles={roles} onRolesUpdated={vi.fn()} />);

    expect(screen.getByText("Administrator")).toBeInTheDocument();
    expect(screen.getByText("Student")).toBeInTheDocument();
  });

  it("shows prompt to select a role", () => {
    render(<RolePermissions roles={roles} onRolesUpdated={vi.fn()} />);

    expect(screen.getByText(/Select a role above/)).toBeInTheDocument();
  });

  it("loads permissions and shows them when a role is selected", async () => {
    render(<RolePermissions roles={roles} onRolesUpdated={vi.fn()} />);

    await user.click(screen.getByText("Administrator"));

    await waitFor(() => {
      expect(screen.getByText("course:create")).toBeInTheDocument();
    });

    expect(screen.getByText("course:delete")).toBeInTheDocument();
    expect(screen.getByText("user:manage")).toBeInTheDocument();
    expect(screen.getByText("role:manage")).toBeInTheDocument();
  });

  it("shows current permissions in left column", async () => {
    render(<RolePermissions roles={roles} onRolesUpdated={vi.fn()} />);

    await user.click(screen.getByText("Administrator"));

    await waitFor(() => {
      expect(screen.getByText("course:create")).toBeInTheDocument();
    });

    const headings = screen.getAllByText("Current Permissions");
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("shows available permissions in right column", async () => {
    render(<RolePermissions roles={roles} onRolesUpdated={vi.fn()} />);

    await user.click(screen.getByText("Administrator"));

    await waitFor(() => {
      expect(screen.getByText("Available to Add")).toBeInTheDocument();
    });
  });

  it("shows no available permissions when all are assigned", async () => {
    const fullRole: Role[] = [
      {
        id: 3,
        name: "SuperUser",
        permissions: [...allPermissions],
      },
    ];

    render(<RolePermissions roles={fullRole} onRolesUpdated={vi.fn()} />);

    await user.click(screen.getByText("SuperUser"));

    await waitFor(() => {
      expect(screen.getByText("All permissions assigned")).toBeInTheDocument();
    });
  });

  it("displays empty current permissions for role with none", async () => {
    render(<RolePermissions roles={roles} onRolesUpdated={vi.fn()} />);

    await user.click(screen.getByText("Student"));

    await waitFor(() => {
      expect(screen.getByText("No permissions")).toBeInTheDocument();
    });
  });

  it("adds a permission to pending changes on + click", async () => {
    render(<RolePermissions roles={roles} onRolesUpdated={vi.fn()} />);

    await user.click(screen.getByText("Administrator"));

    await waitFor(() => {
      expect(screen.getByText("user:manage")).toBeInTheDocument();
    });

    const addButtons = screen.getAllByTitle("Add");
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Pending Changes")).toBeInTheDocument();
    });

    expect(screen.getByText(/user:manage/)).toBeInTheDocument();
  });

  it("removes a permission from pending changes on x click", async () => {
    render(<RolePermissions roles={roles} onRolesUpdated={vi.fn()} />);

    await user.click(screen.getByText("Administrator"));

    await waitFor(() => {
      expect(screen.getByText("course:create")).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByTitle("Remove");
    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Pending Changes")).toBeInTheDocument();
    });
  });

  it("disables save button when no changes are made", async () => {
    render(<RolePermissions roles={roles} onRolesUpdated={vi.fn()} />);

    await user.click(screen.getByText("Administrator"));

    await waitFor(() => {
      expect(screen.getByText("course:create")).toBeInTheDocument();
    });

    const saveBtn = screen.getByText("Save Changes");
    expect(saveBtn).toBeDisabled();
  });

  it("enables save button after adding a permission", async () => {
    render(<RolePermissions roles={roles} onRolesUpdated={vi.fn()} />);

    await user.click(screen.getByText("Administrator"));

    await waitFor(() => {
      expect(screen.getByText("user:manage")).toBeInTheDocument();
    });

    const addButtons = screen.getAllByTitle("Add");
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Save Changes")).not.toBeDisabled();
    });
  });

  it("calls POST when granting a permission", async () => {
    const onUpdated = vi.fn();
    render(<RolePermissions roles={roles} onRolesUpdated={onUpdated} />);

    await user.click(screen.getByText("Administrator"));

    await waitFor(() => {
      expect(screen.getByText("user:manage")).toBeInTheDocument();
    });

    const addButtons = screen.getAllByTitle("Add");
    await user.click(addButtons[0]);

    await user.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/api/roles/permissions", {
        body: { role_name: "Administrator", permission_names: ["user:manage"] },
      });
    });
  });

  it("calls DELETE when revoking a permission", async () => {
    const onUpdated = vi.fn();
    render(<RolePermissions roles={roles} onRolesUpdated={onUpdated} />);

    await user.click(screen.getByText("Administrator"));

    await waitFor(() => {
      expect(screen.getByText("course:create")).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByTitle("Remove");
    await user.click(removeButtons[0]);

    await user.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("/api/roles/permissions", {
        body: { role_name: "Administrator", permission_name: "course:create" },
      });
    });
  });

  it("calls onRolesUpdated with updated roles after save", async () => {
    const onUpdated = vi.fn();
    render(<RolePermissions roles={roles} onRolesUpdated={onUpdated} />);

    await user.click(screen.getByText("Administrator"));

    await waitFor(() => {
      expect(screen.getByText("user:manage")).toBeInTheDocument();
    });

    const addButtons = screen.getAllByTitle("Add");
    await user.click(addButtons[0]);

    await user.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalled();
      const updatedRoles = onUpdated.mock.calls[0][0] as Role[];
      const admin = updatedRoles.find((r) => r.name === "Administrator");
      expect(admin?.permissions.map((p) => p.name)).toContain("user:manage");
    });
  });

  it("shows success message after successful save", async () => {
    render(<RolePermissions roles={roles} onRolesUpdated={vi.fn()} />);

    await user.click(screen.getByText("Administrator"));

    await waitFor(() => {
      expect(screen.getByText("user:manage")).toBeInTheDocument();
    });

    const addButtons = screen.getAllByTitle("Add");
    await user.click(addButtons[0]);

    await user.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(screen.getByText("Permissions updated successfully.")).toBeInTheDocument();
    });
  });

  it("shows error message when save fails", async () => {
    mockPost.mockResolvedValue({ data: undefined, error: { message: "fail" } });

    render(<RolePermissions roles={roles} onRolesUpdated={vi.fn()} />);

    await user.click(screen.getByText("Administrator"));

    await waitFor(() => {
      expect(screen.getByText("user:manage")).toBeInTheDocument();
    });

    const addButtons = screen.getAllByTitle("Add");
    await user.click(addButtons[0]);

    await user.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(screen.getByText(/Some changes failed/)).toBeInTheDocument();
    });
  });
});
