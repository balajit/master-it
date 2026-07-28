import { useEffect, useState } from "react";
import client from "../api/client";
import type { components } from "../api/v1.d.ts";
import Layout from "../components/Layout";
import RolePermissions from "../components/RolePermissions";

type UserProfile = components["schemas"]["UserProfile"];
type Role = components["schemas"]["Role"];

const ROLE_COLORS: Record<string, string> = {
  Administrator: "bg-purple-50 text-purple-700 ring-purple-600/20",
  SuperUser: "bg-red-50 text-red-700 ring-red-600/20",
  Instructor: "bg-blue-50 text-blue-700 ring-blue-600/20",
  Student: "bg-green-50 text-green-700 ring-green-600/20",
  Guest: "bg-gray-100 text-gray-600 ring-gray-500/20",
};

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [assigningUser, setAssigningUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const [usersRes, rolesRes] = await Promise.all([
        client.GET("/api/users"),
        client.GET("/api/roles"),
      ]);

      if (cancelled) return;

      if (usersRes.error || rolesRes.error) {
        setError("Failed to load user management data");
      } else {
        setUsers(usersRes.data as UserProfile[]);
        setRoles(rolesRes.data as Role[]);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAssignRole() {
    if (!assigningUser || !selectedRole) return;
    setAssigning(true);

    const { error: err } = await client.PUT("/api/users/{user_id}/roles", {
      params: { path: { user_id: assigningUser.id } },
      body: { role_name: selectedRole },
    });

    if (err) {
      setError("Failed to assign role");
    } else {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === assigningUser.id
            ? {
                ...u,
                roles: u.roles.some((r) => r.name === selectedRole)
                  ? u.roles
                  : [...u.roles, roles.find((r) => r.name === selectedRole)!].filter(Boolean),
              }
            : u,
        ),
      );
    }

    setAssigningUser(null);
    setSelectedRole("");
    setAssigning(false);
  }

  const q = searchQuery.trim().toLowerCase();
  const filteredUsers = q.length >= 2
    ? users.filter((u) => {
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.roles.some((r) => r.name.toLowerCase().includes(q))
        );
      })
    : users;

  return (
    <Layout>
      <div className="flex flex-col gap-8 py-8">
        <div>
          <p className="text-sm font-medium text-gray-500">Administration</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            User Management
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage user roles and permissions across the platform
          </p>
        </div>

        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-20 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <p className="text-sm text-gray-500">No users found.</p>
        )}

        {!loading && !error && users.length > 0 && (
          <>
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>

            <div className="flex flex-col gap-3">
              {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-sm font-medium text-gray-700">
                    {user.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <span
                          key={role.id}
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${ROLE_COLORS[role.name] ?? "bg-gray-100 text-gray-600 ring-gray-500/20"}`}
                        >
                          {role.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAssigningUser(user);
                    setSelectedRole("");
                  }}
                  className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Assign Role
                </button>
              </div>
            ))}
            </div>

            {!loading && users.length > 0 && q.length >= 2 && filteredUsers.length === 0 && (
              <p className="text-sm text-gray-500">
                No users match &ldquo;{searchQuery}&rdquo;.
              </p>
            )}
          </>
        )}

        <RolePermissions
          roles={roles}
          onRolesUpdated={setRoles}
        />
      </div>

      {assigningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">
              Assign Role
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Assign a role to{" "}
              <span className="font-medium text-gray-700">
                {assigningUser.name}
              </span>
            </p>

            <div className="mt-4 flex flex-col gap-2">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                    selectedRole === role.name
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.name}
                    checked={selectedRole === role.name}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {role.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {role.permissions.length > 0
                        ? role.permissions.map((p) => p.name).join(", ")
                        : "No permissions"}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setAssigningUser(null);
                  setSelectedRole("");
                }}
                disabled={assigning}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignRole}
                disabled={assigning || !selectedRole}
                className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                {assigning ? "Assigning..." : "Assign Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
