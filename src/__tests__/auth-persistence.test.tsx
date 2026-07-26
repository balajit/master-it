// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider } from "../context/AuthContext";
import { useAuth } from "../hooks/useAuth";

vi.mock("../api/client", () => {
  const mockClient = {
    POST: vi.fn(),
    GET: vi.fn(),
    DELETE: vi.fn(),
  };
  return {
    default: mockClient,
    setAuthToken: vi.fn(),
  };
});

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
  };
}

describe("AuthContext session persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("loses session on re-render — reproduces the refresh bug", async () => {
    const { default: mockClient, setAuthToken } = await import("../api/client");
    const mockedPost = mockClient.POST as ReturnType<typeof vi.fn>;

    mockedPost.mockResolvedValue({
      data: { access_token: "fake-jwt-token", token_type: "bearer" },
      error: undefined,
    });

    const wrapper = createWrapper();

    const { result, unmount } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();

    await act(async () => {
      await result.current.register({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        phone: "",
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).not.toBeNull();
    expect(result.current.token).toBe("fake-jwt-token");
    expect(setAuthToken).toHaveBeenCalledWith("fake-jwt-token");

    unmount();

    const { result: resultAfterRefresh } = renderHook(() => useAuth(), {
      wrapper,
    });

    // BUG: Session is lost after re-mount (simulates page refresh).
    // Expected: user remains authenticated with persisted token.
    expect(resultAfterRefresh.current.isAuthenticated).toBe(true);
    expect(resultAfterRefresh.current.user).not.toBeNull();
    expect(resultAfterRefresh.current.token).not.toBeNull();
  });
});
