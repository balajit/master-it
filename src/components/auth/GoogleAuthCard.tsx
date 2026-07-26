import { useState, useRef, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../../hooks/useAuth";

type Mode = "signin" | "signup";

export default function AuthMenu() {
  const [mode, setMode] = useState<Mode>("signin");
  const [open, setOpen] = useState(false);
  const { loginWithGoogle, login, register, isAuthenticated } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isAuthenticated) return null;

  async function handleGoogleSuccess(response: CredentialResponse) {
    if (response.credential) {
      setLoading(true);
      setError(null);
      try {
        await loginWithGoogle(response.credential);
        setOpen(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Google sign-in failed",
        );
      } finally {
        setLoading(false);
      }
    }
  }

  function handleGoogleError() {
    setError("Google sign-in was cancelled or failed");
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "signin") {
        await login({ email: form.email, password: form.password });
      } else {
        await register(form);
      }
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : mode === "signin"
            ? "Sign in failed"
            : "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-7 9a7 7 0 1 1 14 0H3Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-xl bg-white p-4 shadow-lg ring-1 ring-black/5 sm:w-80">
          <div className="mb-4 text-center">
            <h2 className="text-sm font-semibold text-gray-900">
              {mode === "signin" ? "Sign in" : "Create account"}
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                width="100%"
                text={mode === "signin" ? "signin_with" : "signup_with"}
                shape="rectangular"
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="relative">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="bg-white px-2 text-gray-400 uppercase tracking-wider">
                  or
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "signup" && (
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Name"
                  value={form.name}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {mode === "signup" && (
                <input
                  name="phone"
                  type="tel"
                  placeholder="Phone (optional)"
                  value={form.phone}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
              <input
                name="password"
                type="password"
                required
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                {loading
                  ? mode === "signin"
                    ? "Signing in…"
                    : "Creating account…"
                  : mode === "signin"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>

            <p className="text-center text-xs text-gray-500">
              {mode === "signin" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                    }}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                    }}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
