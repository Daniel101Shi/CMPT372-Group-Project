import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { useAuth, type Role } from "../../context/AuthContext";
import { readApiError } from "../../utils/apiError";

const API_URL = import.meta.env.VITE_API_URL || "";

interface AdminUser {
  user_id: number;
  username: string;
  contact_info: string | null;
  role: Role;
  created_at: string;
  pack_count: number;
  friend_count: number;
}

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // which row currently has a request in flight, so only that row's buttons disable
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(readApiError(data, "Failed to load users."));
      }
      setUsers(data.users);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const changeRole = async (target: AdminUser, nextRole: Role) => {
    setBusyUserId(target.user_id);
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${target.user_id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(readApiError(data, "Failed to update role."));
      }
      toast.success(`${target.username} is now ${nextRole}.`);
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setBusyUserId(null);
    }
  };

  const removeUser = async (target: AdminUser) => {
    // deleting cascades to their packs, friendships and saved courses, so make that explicit
    const confirmed = window.confirm(
      `Delete ${target.username}? This also removes their packs, friendships and saved courses. This cannot be undone.`,
    );
    if (!confirmed) return;

    setBusyUserId(target.user_id);
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${target.user_id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(readApiError(data, "Failed to delete user."));
      }
      toast.success(`${target.username} deleted.`);
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user.");
    } finally {
      setBusyUserId(null);
    }
  };

  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Admin</p>
            <h1 style={styles.title}>User management</h1>
            <p style={styles.subtitle}>
              {loading
                ? "Loading..."
                : `${users.length} account${users.length === 1 ? "" : "s"}, ${adminCount} admin${adminCount === 1 ? "" : "s"}`}
            </p>
          </div>
          <Link to="/userprofile" style={styles.linkButton}>
            Back to my profile
          </Link>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {!loading && !error && (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Joined</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Packs</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Friends</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((row) => {
                  const isSelf = row.user_id === user?.user_id;
                  const isBusy = busyUserId === row.user_id;
                  // the server rejects these too (LAST_ADMIN, CANNOT_DELETE_SELF); disabling
                  // here just avoids offering a button that is guaranteed to fail
                  const isLastAdmin = row.role === "admin" && adminCount <= 1;

                  return (
                    <tr key={row.user_id}>
                      <td style={styles.td}>
                        <Link to={`/userprofile/${row.user_id}`} style={styles.userLink}>
                          {row.username}
                        </Link>
                        {isSelf && <span style={styles.youTag}>you</span>}
                        {row.contact_info && (
                          <div style={styles.contact}>{row.contact_info}</div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.roleBadge,
                            ...(row.role === "admin" ? styles.roleAdmin : styles.roleUser),
                          }}
                        >
                          {row.role}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(row.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ ...styles.td, textAlign: "right" }}>{row.pack_count}</td>
                      <td style={{ ...styles.td, textAlign: "right" }}>{row.friend_count}</td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        <div style={styles.actions}>
                          {row.role === "admin" ? (
                            <button
                              type="button"
                              style={styles.secondaryButton}
                              disabled={isBusy || isLastAdmin}
                              title={isLastAdmin ? "Cannot demote the last admin" : undefined}
                              onClick={() => changeRole(row, "user")}
                            >
                              {isBusy ? "Working..." : "Demote"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              style={styles.primaryButton}
                              disabled={isBusy}
                              onClick={() => changeRole(row, "admin")}
                            >
                              {isBusy ? "Working..." : "Promote"}
                            </button>
                          )}
                          <button
                            type="button"
                            style={styles.dangerButton}
                            disabled={isBusy || isSelf}
                            title={isSelf ? "You cannot delete your own account" : undefined}
                            onClick={() => removeUser(row)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "48px 24px",
    background: "radial-gradient(circle at 12% 18%, #eef2ff 0%, #f8fafc 55%, #f1f5f9 100%)",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    color: "#0f172a",
  },
  shell: { maxWidth: 1040, margin: "0 auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#6366f1",
    fontWeight: 700,
  },
  title: { margin: "6px 0 4px", fontSize: "clamp(1.7rem, 3vw, 2.2rem)", fontWeight: 700 },
  subtitle: { margin: 0, color: "#64748b", fontSize: 14 },
  linkButton: {
    display: "inline-block",
    padding: "10px 18px",
    borderRadius: 999,
    background: "#ffffff",
    border: "1px solid #cbd5f5",
    color: "#1e293b",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 14,
  },
  errorBox: {
    padding: "12px 16px",
    borderRadius: 12,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    marginBottom: 20,
  },
  tableWrap: {
    background: "#ffffff",
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    boxShadow: "0 18px 40px -32px rgba(15, 23, 42, 0.5)",
    overflowX: "auto",
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 720 },
  th: {
    textAlign: "left",
    padding: "14px 18px",
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#64748b",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px 18px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 14,
    verticalAlign: "top",
  },
  userLink: { color: "#1d4ed8", textDecoration: "none", fontWeight: 600 },
  youTag: {
    marginLeft: 8,
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 999,
    background: "#e0e7ff",
    color: "#4338ca",
    fontWeight: 700,
  },
  contact: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  roleBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    textTransform: "capitalize",
  },
  roleAdmin: { background: "#fef3c7", color: "#92400e" },
  roleUser: { background: "#f1f5f9", color: "#475569" },
  actions: { display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" },
  primaryButton: {
    padding: "7px 14px",
    borderRadius: 999,
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "7px 14px",
    borderRadius: 999,
    border: "1px solid #cbd5f5",
    background: "#ffffff",
    color: "#1e293b",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  dangerButton: {
    padding: "7px 14px",
    borderRadius: 999,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#b91c1c",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
};
