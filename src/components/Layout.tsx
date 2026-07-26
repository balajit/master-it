import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import UserMenu from "./UserMenu";
import AuthMenu from "./auth/GoogleAuthCard";
import { useAuth } from "../hooks/useAuth";
import { hasRole } from "../context/auth-context";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const isAdmin =
    hasRole(user, "Administrator") || hasRole(user, "SuperUser");
  const isContentCreator =
    isAdmin || hasRole(user, "Instructor");

  console.log("[Layout]", JSON.stringify({
    email: user?.email,
    isAuthenticated,
    isAdmin,
    isContentCreator,
    roleNames: user?.roles?.map(r => r.name) ?? [],
  }));

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4 sm:h-16 sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
          <Link to="/" className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
            master-it
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated && (isAdmin || isContentCreator) && (
              <nav className="flex items-center gap-1">
                <Link
                  to="/"
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    location.pathname === "/"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/users"
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      location.pathname === "/users"
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    Users
                  </Link>
                )}
                {isContentCreator && (
                  <Link
                    to="/courses/manage"
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      location.pathname.startsWith("/courses/manage")
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    Courses
                  </Link>
                )}
              </nav>
            )}
            {isAuthenticated ? <UserMenu /> : <AuthMenu />}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 sm:max-w-2xl sm:px-6 md:max-w-3xl md:px-8 lg:max-w-4xl">
        {children}
      </main>
    </div>
  );
}
