import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type FriendshipUser = {
  user_id: number;
  username: string;
  contact_info?: string | null;
  created_at?: string;
};

type FriendshipDashboard = {
  currentFriends: FriendshipUser[];
  incomingPendingRequests: FriendshipUser[];
  outgoingPendingRequests: FriendshipUser[];
};

type FriendTab = "current" | "incoming" | "outgoing";

const API_URL = import.meta.env.VITE_API_URL || "";

export const UserProfilePage: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FriendTab>("current");
  const [friendships, setFriendships] = useState<FriendshipDashboard>({
    currentFriends: [],
    incomingPendingRequests: [],
    outgoingPendingRequests: [],
  });
  const [isFriendshipsLoading, setIsFriendshipsLoading] = useState(true);
  const [friendshipsError, setFriendshipsError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    if (!user) {
      setFriendships({
        currentFriends: [],
        incomingPendingRequests: [],
        outgoingPendingRequests: [],
      });
      setIsFriendshipsLoading(false);
      return;
    }

    const loadFriendships = async () => {
      setIsFriendshipsLoading(true);
      setFriendshipsError(null);

      try {
        const response = await fetch(`${API_URL}/api/friendships`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          setFriendshipsError(data.error || "Failed to load friendships.");
          return;
        }

        setFriendships({
          currentFriends: data.currentFriends || [],
          incomingPendingRequests: data.incomingPendingRequests || [],
          outgoingPendingRequests: data.outgoingPendingRequests || [],
        });
      } catch (error) {
        console.error("Friendship dashboard error:", error);
        setFriendshipsError("Could not load your friendship dashboard.");
      } finally {
        setIsFriendshipsLoading(false);
      }
    };

    loadFriendships();
  }, [user]);

  const refreshFriendships = async () => {
    const response = await fetch(`${API_URL}/api/friendships`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to refresh friendships.");
    }

    setFriendships({
      currentFriends: data.currentFriends || [],
      incomingPendingRequests: data.incomingPendingRequests || [],
      outgoingPendingRequests: data.outgoingPendingRequests || [],
    });
  };

  const handleAcceptRequest = async (requesterId: number) => {
    if (!user) {
      return;
    }

    setBusyUserId(requesterId);
    setFriendshipsError(null);

    try {
      const response = await fetch(`${API_URL}/api/friendships/accept`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          requesterId,
          recipientId: user.user_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept friendship request.");
      }

      await refreshFriendships();
    } catch (error) {
      console.error("Accept friendship request error:", error);
      setFriendshipsError(
        error instanceof Error ? error.message : "Failed to accept friendship request.",
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDeleteFriendship = async (otherUserId: number) => {
    if (!user) {
      return;
    }

    setBusyUserId(otherUserId);
    setFriendshipsError(null);

    try {
      const response = await fetch(`${API_URL}/api/friendships`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          requesterId: user.user_id,
          recipientId: otherUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update friendship.");
      }

      await refreshFriendships();
    } catch (error) {
      console.error("Delete friendship error:", error);
      setFriendshipsError(error instanceof Error ? error.message : "Failed to update friendship.");
    } finally {
      setBusyUserId(null);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <p style={styles.loadingText}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.page}>
        <div style={styles.emptyCard}>
          <span style={styles.badge}>Session required</span>
          <h1 style={styles.emptyTitle}>Sign in to view your profile</h1>
          <p style={styles.emptyText}>
            Your profile page shows the account details tied to your current Lopo session.
          </p>
          <div style={styles.emptyActions}>
            <Link to="/" style={{ ...styles.primaryButton, ...styles.linkButton }}>
              Go to login
            </Link>
            <Link to="/register" style={{ ...styles.secondaryButton, ...styles.linkButton }}>
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently joined";

  const hasContactInfo = Boolean(user.contact_info && user.contact_info.trim());
  const friendTabs: { id: FriendTab; label: string; count: number }[] = [
    { id: "current", label: "Current friends", count: friendships.currentFriends.length },
    {
      id: "incoming",
      label: "Incoming requests",
      count: friendships.incomingPendingRequests.length,
    },
    {
      id: "outgoing",
      label: "Sent requests",
      count: friendships.outgoingPendingRequests.length,
    },
  ];

  const activeItems =
    activeTab === "current"
      ? friendships.currentFriends
      : activeTab === "incoming"
        ? friendships.incomingPendingRequests
        : friendships.outgoingPendingRequests;

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.heroCard}>
          <div style={styles.heroContent}>
            <div>
              <span style={styles.badge}>Lopo profile</span>
              <h1 style={styles.heroTitle}>Welcome back, {user.username}</h1>
              <p style={styles.heroText}>
                Keep your account details in one place and jump back into schedule planning
                whenever you need it.
              </p>
            </div>

            <div style={styles.heroActions}>
              <Link
                to="/schedulebuilder"
                style={{ ...styles.primaryButton, ...styles.linkButton }}
              >
                Open schedule builder
              </Link>
              <button type="button" onClick={handleLogout} style={styles.secondaryButton}>
                Log out
              </button>
            </div>
          </div>

          <div style={styles.heroStats}>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Username</span>
              <strong style={styles.statValue}>@{user.username}</strong>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Contact</span>
              <strong style={styles.statValue}>{hasContactInfo ? "Added" : "Missing"}</strong>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Friends</span>
              <strong style={styles.statValue}>{friendships.currentFriends.length}</strong>
            </div>
          </div>
        </section>

        <section style={styles.grid}>
          <article style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Account details</h2>
              <span style={styles.panelAccent} />
            </div>

            <div style={styles.detailList}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Username</span>
                <span style={styles.detailValue}>{user.username}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Contact info</span>
                <span style={styles.detailValue}>
                  {hasContactInfo ? user.contact_info : "No contact info added yet"}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Joined</span>
                <span style={styles.detailValue}>{joinedDate}</span>
              </div>
            </div>
          </article>

          <article style={{ ...styles.panel, ...styles.dashboardPanel }}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Friends dashboard</h2>
              <span style={styles.panelAccent} />
            </div>

            <div style={styles.tabList}>
              {friendTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === tab.id ? styles.activeTabButton : {}),
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={styles.tabCount}>{tab.count}</span>
                </button>
              ))}
            </div>

            {friendshipsError && <div style={styles.errorBox}>{friendshipsError}</div>}

            {isFriendshipsLoading ? (
              <div style={styles.dashboardEmptyState}>
                <p style={styles.dashboardEmptyTitle}>Loading friendship dashboard...</p>
              </div>
            ) : activeItems.length === 0 ? (
              <div style={styles.dashboardEmptyState}>
                <p style={styles.dashboardEmptyTitle}>
                  {activeTab === "current" && "No current friends yet"}
                  {activeTab === "incoming" && "No incoming requests"}
                  {activeTab === "outgoing" && "No outgoing requests"}
                </p>
                <p style={styles.dashboardEmptyText}>
                  {activeTab === "current" &&
                    "Once you start connecting with people, your active friends will show up here."}
                  {activeTab === "incoming" &&
                    "New requests waiting for your response will appear in this tab."}
                  {activeTab === "outgoing" &&
                    "Requests you send to other users will stay here until they accept or you cancel them."}
                </p>
              </div>
            ) : (
              <div style={styles.friendList}>
                {activeItems.map((friend) => (
                  <div key={`${activeTab}-${friend.user_id}`} style={styles.friendCard}>
                    <div style={styles.friendIdentity}>
                      <div style={styles.avatarCircle}>
                        {friend.username.slice(0, 1).toUpperCase()}
                      </div>
                      <div style={styles.friendMeta}>
                        <strong style={styles.friendName}>{friend.username}</strong>
                        <span style={styles.friendSubtext}>
                          {friend.contact_info?.trim() || "No contact info added"}
                        </span>
                      </div>
                    </div>

                    <div style={styles.friendActions}>
                      {activeTab === "incoming" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAcceptRequest(friend.user_id)}
                            disabled={busyUserId === friend.user_id}
                            style={styles.smallPrimaryButton}
                          >
                            {busyUserId === friend.user_id ? "Accepting..." : "Accept"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFriendship(friend.user_id)}
                            disabled={busyUserId === friend.user_id}
                            style={styles.smallSecondaryButton}
                          >
                            Decline
                          </button>
                        </>
                      ) : activeTab === "outgoing" ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteFriendship(friend.user_id)}
                          disabled={busyUserId === friend.user_id}
                          style={styles.smallSecondaryButton}
                        >
                          {busyUserId === friend.user_id ? "Cancelling..." : "Cancel request"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteFriendship(friend.user_id)}
                          disabled={busyUserId === friend.user_id}
                          style={styles.smallSecondaryButton}
                        >
                          {busyUserId === friend.user_id ? "Removing..." : "Remove friend"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "32px 20px",
    background:
      "radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 28%), linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%)",
  },
  shell: {
    maxWidth: "1120px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.10)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  heroContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 12px",
    borderRadius: "999px",
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  },
  heroTitle: {
    margin: "14px 0 10px",
    fontSize: "clamp(2rem, 3.5vw, 3rem)",
    lineHeight: 1.05,
    color: "#0f172a",
  },
  heroText: {
    margin: 0,
    maxWidth: "620px",
    fontSize: "16px",
    lineHeight: 1.6,
    color: "#475569",
  },
  heroActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  primaryButton: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "46px",
    padding: "0 18px",
    borderRadius: "12px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 700,
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(37, 99, 235, 0.22)",
  },
  secondaryButton: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "46px",
    padding: "0 18px",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: 700,
    textDecoration: "none",
    border: "1px solid #cbd5e1",
    cursor: "pointer",
  },
  linkButton: {
    textDecoration: "none",
  },
  heroStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
  },
  statCard: {
    padding: "18px",
    borderRadius: "18px",
    background: "linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
    border: "1px solid #dbeafe",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  statLabel: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  statValue: {
    fontSize: "20px",
    color: "#0f172a",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 340px) minmax(0, 1fr)",
    gap: "20px",
  },
  panel: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  dashboardPanel: {
    minWidth: 0,
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  panelTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#0f172a",
  },
  panelAccent: {
    width: "42px",
    height: "10px",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)",
  },
  detailList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  detailRow: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    paddingBottom: "14px",
    borderBottom: "1px solid #e2e8f0",
  },
  detailLabel: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  detailValue: {
    fontSize: "16px",
    color: "#0f172a",
    lineHeight: 1.5,
  },
  tabList: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  tabButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    borderRadius: "999px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#f8fafc",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  activeTabButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "1px solid #2563eb",
    boxShadow: "0 10px 24px rgba(37, 99, 235, 0.18)",
  },
  tabCount: {
    display: "inline-flex",
    minWidth: "26px",
    height: "26px",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "999px",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    fontSize: "12px",
    fontWeight: 800,
  },
  errorBox: {
    padding: "12px 14px",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    borderRadius: "12px",
    fontSize: "14px",
    border: "1px solid #fecaca",
  },
  dashboardEmptyState: {
    padding: "28px",
    borderRadius: "18px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  dashboardEmptyTitle: {
    margin: "0 0 8px 0",
    fontSize: "18px",
    fontWeight: 700,
    color: "#0f172a",
  },
  dashboardEmptyText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#475569",
  },
  friendList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  friendCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    padding: "18px",
    borderRadius: "18px",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
    border: "1px solid #dbeafe",
  },
  friendIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: 0,
  },
  avatarCircle: {
    width: "48px",
    height: "48px",
    borderRadius: "999px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)",
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 800,
    flexShrink: 0,
  },
  friendMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: 0,
  },
  friendName: {
    fontSize: "16px",
    color: "#0f172a",
  },
  friendSubtext: {
    fontSize: "14px",
    color: "#64748b",
    overflowWrap: "anywhere",
  },
  friendActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  smallPrimaryButton: {
    minHeight: "40px",
    padding: "0 14px",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
  },
  smallSecondaryButton: {
    minHeight: "40px",
    padding: "0 14px",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 700,
    border: "1px solid #cbd5e1",
    cursor: "pointer",
  },
  loadingCard: {
    maxWidth: "440px",
    margin: "0 auto",
    marginTop: "12vh",
    padding: "28px",
    borderRadius: "18px",
    backgroundColor: "#ffffff",
    boxShadow: "0 14px 32px rgba(15, 23, 42, 0.08)",
    textAlign: "center",
  },
  loadingText: {
    margin: 0,
    fontSize: "16px",
    color: "#475569",
  },
  emptyCard: {
    maxWidth: "540px",
    margin: "0 auto",
    marginTop: "10vh",
    padding: "32px",
    borderRadius: "24px",
    backgroundColor: "#ffffff",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.10)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
  },
  emptyTitle: {
    margin: "18px 0 10px",
    fontSize: "30px",
    color: "#0f172a",
  },
  emptyText: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.7,
    color: "#475569",
  },
  emptyActions: {
    marginTop: "24px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
};
