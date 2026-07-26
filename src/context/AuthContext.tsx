import { useState, useCallback } from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import client, { setAuthToken } from "../api/client";
import {
  AuthContext,
  type User,
  type Role,
  type RegisterPayload,
  type LoginPayload,
} from "./auth-context";

const STORAGE_KEY = "master_it_auth";

interface GoogleJwtPayload {
  name?: string;
  email?: string;
  picture?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

interface StoredAuth {
  token: string;
  user: User;
}

function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

function saveStoredAuth(token: string, user: User) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
}

function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

async function fetchMe(): Promise<{ id: number; roles: Role[] }> {
  try {
    const { data, error } = await client.GET("/api/me");
    if (error) {
      console.error("[Auth] /api/me error:", error);
      return { id: 0, roles: [] };
    }
    const me = data as { id?: number; roles?: Role[] };
    return { id: me.id ?? 0, roles: me.roles ?? [] };
  } catch (e) {
    console.error("[Auth] /api/me exception:", e);
    return { id: 0, roles: [] };
  }
}

function getInitialAuth(): { token: string | null; user: User | null } {
  const stored = loadStoredAuth();
  if (stored) {
    setAuthToken(stored.token);
    return { token: stored.token, user: stored.user };
  }
  return { token: null, user: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getInitialAuth().user);
  const [token, setToken] = useState<string | null>(() => getInitialAuth().token);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const { data, error } = await client.POST("/api/auth/google", {
      body: { id_token: credential },
    });
    if (error) throw error;

    const { access_token } = data as TokenResponse;
    setToken(access_token);
    setAuthToken(access_token);

    const payload = jwtDecode<GoogleJwtPayload>(credential);
    const me = await fetchMe();
    const nextUser: User = {
      id: me.id,
      name: payload.name ?? "Unknown User",
      email: payload.email ?? "",
      avatarUrl: payload.picture ?? "",
      roles: me.roles,
    };

    setUser(nextUser);
    saveStoredAuth(access_token, nextUser);
  }, []);

  const login = useCallback(async (loginPayload: LoginPayload) => {
    const { data, error } = await client.POST("/api/auth/login", {
      body: loginPayload,
    });
    if (error) throw error;

    const { access_token } = data as TokenResponse;
    setToken(access_token);
    setAuthToken(access_token);

    const me = await fetchMe();
    const nextUser: User = {
      id: me.id,
      name: loginPayload.email,
      email: loginPayload.email,
      avatarUrl: "",
      roles: me.roles,
    };

    setUser(nextUser);
    saveStoredAuth(access_token, nextUser);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { data, error } = await client.POST("/api/auth/register", {
      body: payload,
    });
    if (error) throw error;

    const { access_token } = data as TokenResponse;
    setToken(access_token);
    setAuthToken(access_token);

    const me = await fetchMe();
    const nextUser: User = {
      id: me.id,
      name: payload.name || payload.email,
      email: payload.email,
      avatarUrl: "",
      roles: me.roles,
    };

    setUser(nextUser);
    saveStoredAuth(access_token, nextUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    clearStoredAuth();
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: user !== null,
    loginWithGoogle,
    login,
    register,
    logout,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}
