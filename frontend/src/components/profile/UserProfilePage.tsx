import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const UserProfilePage: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
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
  const hasSchedule = Boolean(user.campus_schedule && user.campus_schedule.trim());

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
              <span style={styles.statLabel}>Schedule</span>
              <strong style={styles.statValue}>{hasSchedule ? "Saved" : "Not set"}</strong>
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

          <article style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Campus schedule</h2>
              <span style={styles.panelAccent} />
            </div>

            <div style={styles.scheduleCard}>
              <p style={styles.scheduleText}>
                {hasSchedule
                  ? user.campus_schedule
                  : "You have not saved a campus schedule yet. Build one to start sharing it with friends."}
              </p>
              <Link
                to="/schedulebuilder"
                style={{ ...styles.inlineLink, alignSelf: "flex-start" }}
              >
                {hasSchedule ? "Update your schedule" : "Create your schedule"}
              </Link>
            </div>
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
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
  scheduleCard: {
    padding: "18px",
    borderRadius: "18px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  scheduleText: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.7,
    color: "#334155",
    whiteSpace: "pre-wrap",
  },
  inlineLink: {
    color: "#2563eb",
    fontWeight: 700,
    textDecoration: "none",
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
