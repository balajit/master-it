import { createContext } from "react";

export interface Permission {
  id: number;
  name: string;
}

export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl: string;
  roles: Role[];
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  return (user.roles ?? []).some((role) =>
    role.permissions.some((p) => p.name === permission || p.name === "*"),
  );
}

export function hasRole(user: User | null, roleName: string): boolean {
  if (!user) return false;
  return (user.roles ?? []).some((role) => role.name === roleName);
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loginWithGoogle: (credential: string) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);
