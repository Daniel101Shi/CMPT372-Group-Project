import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

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

type RelationshipStatus =
  | "self"
  | "none"
  | "friends"
  | "incoming_request"
  | "outgoing_request";

type ViewedProfile = {
  user_id: number;
  username: string;
  contact_info?: string | null;
  created_at?: string;
  packCount: number;
  friendsCount: number;
  isOwnProfile: boolean;
  relationshipStatus: RelationshipStatus;
  canViewContactInfo: boolean;
};

const API_URL = import.meta.env.VITE_API_URL || "";

const emptyFriendships: FriendshipDashboard = {
  currentFriends: [],
  incomingPendingRequests: [],
  outgoingPendingRequests: [],
};

export const UserProfilePage: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();

  const [profile, setProfile] = useState<ViewedProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<FriendTab>("current");
  const [friendships, setFriendships] = useState<FriendshipDashboard>(emptyFriendships);
  const [isFriendshipsLoading, setIsFriendshipsLoading] = useState(false);
  const [friendshipsError, setFriendshipsError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [isRelationshipUpdating, setIsRelationshipUpdating] = useState(false);

  const viewedUserId = userId ? Number(userId) : user?.user_id ?? null;

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const fetchProfile = async (targetUserId: number) => {
    const response = await fetch(`${API_URL}/api/users/${targetUserId}/profile`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load profile.");
    }

    return data.profile as ViewedProfile;
  };

  const fetchFriendships = async () => {
    const response = await fetch(`${API_URL}/api/friendships`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load friendships.");
    }

    return {
      currentFriends: data.currentFriends || [],
      incomingPendingRequests: data.incomingPendingRequests || [],
      outgoingPendingRequests: data.outgoingPendingRequests || [],
    } as FriendshipDashboard;
  };

  const refreshPageData = async () => {
    if (!user || !viewedUserId) {
      return;
    }

    const nextProfile = await fetchProfile(viewedUserId);
    setProfile(nextProfile);

    if (nextProfile.isOwnProfile) {
      const nextFriendships = await fetchFriendships();
      setFriendships(nextFriendships);
    } else {
      setFriendships(emptyFriendships);
      setFriendshipsError(null);
    }
  };

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setFriendships(emptyFriendships);
      setIsProfileLoading(false);
      return;
    }

    if (!viewedUserId || !Number.isInteger(viewedUserId) || viewedUserId <= 0) {
      setProfile(null);
      setProfileError("That profile does not exist.");
      setIsProfileLoading(false);
      return;
    }

    const load = async () => {
      setIsProfileLoading(true);
      setProfileError(null);
      setFriendshipsError(null);

      try {
        const nextProfile = await fetchProfile(viewedUserId);
        setProfile(nextProfile);

        if (nextProfile.isOwnProfile) {
          setIsFriendshipsLoading(true);
          const nextFriendships = await fetchFriendships();
          setFriendships(nextFriendships);
        } else {
          setFriendships(emptyFriendships);
        }
      } catch (error) {
        console.error("Profile page load error:", error);
        setProfile(null);
        setProfileError(error instanceof Error ? error.message : "Failed to load profile.");
      } finally {
        setIsProfileLoading(false);
        setIsFriendshipsLoading(false);
      }
    };

    load();
  }, [user, viewedUserId]);

  const updateRelationship = async (
    endpoint: string,
    method: "POST" | "PATCH" | "DELETE",
    body: Record<string, number>,
  ) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update friendship.");
    }
  };

  const handleAcceptRequest = async (requesterId: number) => {
    if (!user) {
      return;
    }

    setBusyUserId(requesterId);
    setFriendshipsError(null);
    setProfileError(null);

    try {
      await updateRelationship("/api/friendships/accept", "PATCH", {
        requesterId,
        recipientId: user.user_id,
      });
      await refreshPageData();
    } catch (error) {
      console.error("Accept friendship request error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to accept friendship request.";
      setFriendshipsError(message);
      setProfileError(message);
    } finally {
      setBusyUserId(null);
      setIsRelationshipUpdating(false);
    }
  };

  const handleDeleteFriendship = async (otherUserId: number) => {
    if (!user) {
      return;
    }

    setBusyUserId(otherUserId);
    setFriendshipsError(null);
    setProfileError(null);
    setIsRelationshipUpdating(true);

    try {
      await updateRelationship("/api/friendships", "DELETE", {
        requesterId: user.user_id,
        recipientId: otherUserId,
      });
      await refreshPageData();
    } catch (error) {
      console.error("Delete friendship error:", error);
      const message = error instanceof Error ? error.message : "Failed to update friendship.";
      setFriendshipsError(message);
      setProfileError(message);
    } finally {
      setBusyUserId(null);
      setIsRelationshipUpdating(false);
    }
  };

  const handleProfileRelationshipAction = async () => {
    if (!profile || !user || profile.isOwnProfile) {
      return;
    }

    setIsRelationshipUpdating(true);
    setProfileError(null);

    try {
      if (profile.relationshipStatus === "none") {
        await updateRelationship("/api/friendship/request", "POST", {
          requesterId: user.user_id,
          recipientId: profile.user_id,
        });
      } else if (profile.relationshipStatus === "incoming_request") {
        await updateRelationship("/api/friendships/accept", "PATCH", {
          requesterId: profile.user_id,
          recipientId: user.user_id,
        });
      } else {
        await updateRelationship("/api/friendships", "DELETE", {
          requesterId: user.user_id,
          recipientId: profile.user_id,
        });
      }

      await refreshPageData();
    } catch (error) {
      console.error("Profile relationship update error:", error);
      setProfileError(error instanceof Error ? error.message : "Failed to update friendship.");
    } finally {
      setIsRelationshipUpdating(false);
    }
  };

  if (loading || isProfileLoading) {
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
          <h1 style={styles.emptyTitle}>Sign in to view profiles</h1>
          <p style={styles.emptyText}>
            Profile pages depend on your current Lopo session so we can show the right actions and
            visibility.
          </p>
          <div style={styles.emptyActions}>
            <Link to="/" style={{ ...styles.primaryButton, ...styles.linkButton }}>
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={styles.page}>
        <div style={styles.emptyCard}>
          <span style={styles.badge}>Profile unavailable</span>
          <h1 style={styles.emptyTitle}>This profile could not be loaded</h1>
          <p style={styles.emptyText}>{profileError || "Please try again."}</p>
          <div style={styles.emptyActions}>
            <Link
              to="/userprofile"
              style={{ ...styles.primaryButton, ...styles.linkButton }}
            >
              Back to my profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const joinedDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently joined";

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

  const relationshipLabel =
    profile.relationshipStatus === "self"
      ? "Your account"
      : profile.relationshipStatus === "friends"
        ? "Friends"
        : profile.relationshipStatus === "incoming_request"
          ? "Incoming request"
          : profile.relationshipStatus === "outgoing_request"
            ? "Request sent"
            : "Not connected";

  const relationshipActionLabel =
    profile.relationshipStatus === "none"
      ? "Send friend request"
      : profile.relationshipStatus === "incoming_request"
        ? "Accept request"
        : profile.relationshipStatus === "outgoing_request"
          ? "Cancel request"
          : "Remove friend";

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.heroCard}>
          <div style={styles.heroContent}>
            <div>
              <span style={styles.badge}>
                {profile.isOwnProfile ? "Your profile" : "Member profile"}
              </span>
              <h1 style={styles.heroTitle}>
                {profile.isOwnProfile ? `Welcome back, ${profile.username}` : profile.username}
              </h1>
              <p style={styles.heroText}>
                {profile.isOwnProfile
                  ? "Manage your account, check your packs, and keep track of who is already in your circle."
                  : "See who this person is, how connected you are, and whether it makes sense to send or respond to a friend request."}
              </p>
            </div>

            <div style={styles.heroActions}>
              {profile.isOwnProfile ? (
                <>
                  <Link
                    to="/schedulebuilder"
                    style={{ ...styles.primaryButton, ...styles.linkButton }}
                  >
                    Open schedule builder
                  </Link>
                  <button type="button" onClick={handleLogout} style={styles.secondaryButton}>
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleProfileRelationshipAction}
                    disabled={isRelationshipUpdating}
                    style={styles.primaryButton}
                  >
                    {isRelationshipUpdating ? "Updating..." : relationshipActionLabel}
                  </button>
                  {profile.relationshipStatus === "incoming_request" && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFriendship(profile.user_id)}
                      disabled={isRelationshipUpdating}
                      style={styles.secondaryButton}
                    >
                      Decline
                    </button>
                  )}
                  <Link
                    to="/userprofile"
                    style={{ ...styles.secondaryButton, ...styles.linkButton }}
                  >
                    Back to my profile
                  </Link>
                </>
              )}
            </div>
          </div>

          <div style={styles.heroStats}>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Status</span>
              <strong style={styles.statValue}>{relationshipLabel}</strong>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Friends</span>
              <strong style={styles.statValue}>{profile.friendsCount}</strong>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Packs</span>
              <strong style={styles.statValue}>{profile.packCount}</strong>
            </div>
          </div>
        </section>

        {profileError && <div style={styles.errorBox}>{profileError}</div>}

        <section style={styles.grid}>
          <article style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>
                {profile.isOwnProfile ? "Account details" : "Profile details"}
              </h2>
              <span style={styles.panelAccent} />
            </div>

            <div style={styles.detailList}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Username</span>
                <span style={styles.detailValue}>{profile.username}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Contact info</span>
                <span style={styles.detailValue}>
                  {profile.canViewContactInfo
                    ? profile.contact_info || "No contact info added"
                    : "Hidden until you are friends"}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Joined</span>
                <span style={styles.detailValue}>{joinedDate}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Owned packs</span>
                <span style={styles.detailValue}>
                  {profile.packCount} {profile.packCount === 1 ? "pack" : "packs"}
                </span>
              </div>
            </div>
          </article>

          {profile.isOwnProfile ? (
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
                      "Once you connect with people, their profiles and actions will show up here."}
                    {activeTab === "incoming" &&
                      "Incoming requests wait here until you accept them or decline them."}
                    {activeTab === "outgoing" &&
                      "Requests you send stay here until the other person accepts or you cancel them."}
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
                        <Link
                          to={`/userprofile/${friend.user_id}`}
                          style={{ ...styles.smallGhostButton, ...styles.linkButton }}
                        >
                          View profile
                        </Link>
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
          ) : (
            <article style={{ ...styles.panel, ...styles.dashboardPanel }}>
              <div style={styles.panelHeader}>
                <h2 style={styles.panelTitle}>Connection overview</h2>
                <span style={styles.panelAccent} />
              </div>

              <div style={styles.relationshipCard}>
                <div style={styles.relationshipBadge}>{relationshipLabel}</div>
                <p style={styles.relationshipText}>
                  {profile.relationshipStatus === "none" &&
                    "You are not connected yet. Send a request if you want to compare schedules or coordinate packs later."}
                  {profile.relationshipStatus === "incoming_request" &&
                    "This person already sent you a request. You can accept it from here or decline it if you are not ready to connect."}
                  {profile.relationshipStatus === "outgoing_request" &&
                    "You already sent a request. Leave it pending or cancel it if you changed your mind."}
                  {profile.relationshipStatus === "friends" &&
                    "You are already connected. Their contact info is visible and you can remove the friendship if needed."}
                </p>
                <div style={styles.relationshipActions}>
                  <button
                    type="button"
                    onClick={handleProfileRelationshipAction}
                    disabled={isRelationshipUpdating}
                    style={styles.smallPrimaryButton}
                  >
                    {isRelationshipUpdating ? "Updating..." : relationshipActionLabel}
                  </button>
                  {profile.relationshipStatus === "incoming_request" && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFriendship(profile.user_id)}
                      disabled={isRelationshipUpdating}
                      style={styles.smallSecondaryButton}
                    >
                      Decline request
                    </button>
                  )}
                </div>
              </div>

              <div style={styles.dashboardEmptyState}>
                <p style={styles.dashboardEmptyTitle}>What you can see here</p>
                <p style={styles.dashboardEmptyText}>
                  Pack count and high-level profile info stay visible. Contact info is only shown
                  once both users are connected as friends.
                </p>
              </div>
            </article>
          )}
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
    maxWidth: "640px",
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
    overflowWrap: "anywhere",
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
  smallGhostButton: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "40px",
    padding: "0 14px",
    borderRadius: "10px",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "14px",
    fontWeight: 700,
    border: "1px solid #bfdbfe",
  },
  relationshipCard: {
    padding: "20px",
    borderRadius: "18px",
    background: "linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
    border: "1px solid #dbeafe",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  relationshipBadge: {
    alignSelf: "flex-start",
    padding: "8px 12px",
    borderRadius: "999px",
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "13px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  relationshipText: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.7,
    color: "#334155",
  },
  relationshipActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
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
