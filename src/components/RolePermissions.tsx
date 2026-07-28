import { useEffect, useState } from "react";
import client from "../api/client";
import type { components } from "../api/v1.d.ts";

type Role = components["schemas"]["Role"];
type Permission = components["schemas"]["Permission"];

interface Props {
  roles: Role[];
  onRolesUpdated: (roles: Role[]) => void;
}

export default function RolePermissions({ roles, onRolesUpdated }: Props) {
  const [selectedRoleName, setSelectedRoleName] = useState<string>("");
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [currentIds, setCurrentIds] = useState<Set<number>>(new Set());
  const [workingIds, setWorkingIds] = useState<Set<number>>(new Set());
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedRole = roles.find((r) => r.name === selectedRoleName);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingPerms(true);
      setError(null);
      setSuccess(false);

      const res = await client.GET("/api/permissions");
      if (cancelled) return;

      if (res.error) {
        setError("Failed to load permissions");
      } else {
        setAllPermissions(res.data as Permission[]);
      }
      setLoadingPerms(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function addPermission(id: number) {
    setWorkingIds((prev) => new Set(prev).add(id));
    setSuccess(false);
  }

  function removePermission(id: number) {
    setWorkingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setSuccess(false);
  }

  async function handleSave() {
    if (!selectedRole) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    const toGrant = [...workingIds].filter(
      (id) => !currentIds.has(id),
    );
    const toRevoke = [...currentIds].filter(
      (id) => !workingIds.has(id),
    );

    const roleName = selectedRole.name;

    const permNames = toGrant
      .map((permId) => allPermissions.find((p) => p.id === permId)!.name)
      .filter(Boolean);

    const grantResult = permNames.length > 0
      ? await client.POST("/api/roles/permissions", {
        body: { role_name: roleName, permission_names: permNames },
      })
      : null;

    const revokeResults = await Promise.all(
      toRevoke.map((permId) => {
        const perm = allPermissions.find((p) => p.id === permId);
        return client.DELETE("/api/roles/permissions", {
          body: { role_name: roleName, permission_name: perm!.name },
        });
      }),
    );

    const anyError =
      Boolean(grantResult?.error) ||
      revokeResults.some((r) => r.error);

    if (anyError) {
      setError("Some changes failed to save. Please try again.");
    } else {
      setSuccess(true);
      const updatedPerms = allPermissions.filter((p) => workingIds.has(p.id));
      const updatedRoles = roles.map((r) =>
        r.name === roleName ? { ...r, permissions: updatedPerms } : r,
      );
      onRolesUpdated(updatedRoles);
      setCurrentIds(new Set(workingIds));
    }

    setSaving(false);
  }

  const currentPermissions = allPermissions.filter((p) => currentIds.has(p.id));
  const pendingAdd = allPermissions.filter(
    (p) => workingIds.has(p.id) && !currentIds.has(p.id),
  );
  const pendingRemove = allPermissions.filter(
    (p) => !workingIds.has(p.id) && currentIds.has(p.id),
  );
  const availableToAdd = allPermissions.filter((p) => !workingIds.has(p.id));

  const hasChanges =
    selectedRole &&
    (pendingAdd.length > 0 || pendingRemove.length > 0);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
      <p className="text-sm font-medium text-gray-500">Administration</p>
      <h2 className="mt-1 text-lg font-bold tracking-tight text-gray-900">
        Role Permissions
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Manage permissions assigned to each role
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => {
              const ids = new Set(role.permissions.map((p) => p.id));
              setSelectedRoleName(role.name);
              setCurrentIds(ids);
              setWorkingIds(new Set(ids));
              setSuccess(false);
              setError(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedRoleName === role.name
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {role.name}
          </button>
        ))}
      </div>

      {!selectedRole && (
        <p className="mt-6 text-sm text-gray-400">
          Select a role above to manage its permissions
        </p>
      )}

      {selectedRole && loadingPerms && (
        <div className="mt-6 flex flex-col gap-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-10 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      )}

      {selectedRole && !loadingPerms && (
        <>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Current Permissions
              </h3>
              <div className="mt-2 flex flex-col gap-1.5">
                {currentPermissions.length === 0 && (
                  <p className="text-sm text-gray-400">No permissions</p>
                )}
                {currentPermissions.map((perm) => {
                  const isPendingRemove = pendingRemove.some((p) => p.id === perm.id);
                  return (
                    <div
                      key={perm.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                        isPendingRemove
                          ? "bg-red-50 text-red-700 line-through"
                          : "bg-gray-50 text-gray-800"
                      }`}
                    >
                      <span>{perm.name}</span>
                      <button
                        type="button"
                        onClick={() => removePermission(perm.id)}
                        className="ml-2 shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
                        title="Remove"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Available to Add
              </h3>
              <div className="mt-2 flex flex-col gap-1.5">
                {availableToAdd.length === 0 && (
                  <p className="text-sm text-gray-400">
                    All permissions assigned
                  </p>
                )}
                {availableToAdd.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-800"
                  >
                    <span>{perm.name}</span>
                    <button
                      type="button"
                      onClick={() => addPermission(perm.id)}
                      className="ml-2 shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
                      title="Add"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {(pendingAdd.length > 0 || pendingRemove.length > 0) && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Pending Changes
              </h3>
              <div className="mt-2 flex flex-col gap-1">
                {pendingAdd.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-center gap-2 text-sm text-green-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                    </svg>
                    + {perm.name}
                  </div>
                ))}
                {pendingRemove.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-center gap-2 text-sm text-red-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                    - {perm.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">
              Permissions updated successfully.
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => {
                const toRevoke = [...currentIds].filter(
                  (id) => !workingIds.has(id),
                );
                if (
                  toRevoke.length > 0 &&
                  !window.confirm(
                    `Remove ${toRevoke.length} permission${toRevoke.length > 1 ? "s" : ""} from "${selectedRole?.name}"?`,
                  )
                ) {
                  return;
                }
                handleSave();
              }}
              disabled={saving || !hasChanges}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
