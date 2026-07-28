import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { CalendarView } from "./CalendarView";
import { buildCourseColorMap } from "./courseColors";
import type { Course } from "./types";

type Term = "spring" | "summer" | "fall";

type FriendSchedule = {
  userId: number;
  username: string;
  courses: Course[];
};

const TERMS: Term[] = ["spring", "summer", "fall"];

const API_URL = import.meta.env.VITE_API_URL || "";

export const ScheduleViewerComponent: React.FC = () => {
  const { friendUserId } = useParams<{ friendUserId?: string }>();
  const [term, setTerm] = useState<Term>("fall");
  const [courses, setCourses] = useState<Course[]>([]);
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOwnCourses = async () => {
      const response = await fetch(`${API_URL}/api/getcourse/${term}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to load courses.");
      }

      setCourses(data.courses);
      setOwnerUsername(null);
    };

    const loadFriendCourses = async (targetUserId: number) => {
      const response = await fetch(`${API_URL}/api/getfriendscourse/${term}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to load courses.");
      }

      const schedules = data.schedules as FriendSchedule[];
      const friendSchedule = schedules.find((schedule) => schedule.userId === targetUserId);

      if (!friendSchedule) {
        throw new Error("This user is not one of your friends.");
      }

      setCourses(friendSchedule.courses);
      setOwnerUsername(friendSchedule.username);
    };

    const loadCourses = async () => {
      setError(null);

      try {
        if (friendUserId) {
          await loadFriendCourses(Number(friendUserId));
        } else {
          await loadOwnCourses();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses.");
      }
    };

    loadCourses();
  }, [term, friendUserId]);

  const colorMap = useMemo(() => buildCourseColorMap(courses), [courses]);
  const backTo = friendUserId ? `/userprofile/${friendUserId}` : "/userprofile";
  const heading = ownerUsername ? `${ownerUsername}'s Calendar` : "Calendar";

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <aside style={styles.sidebar}>
          <Link to={backTo} style={{ ...styles.secondaryButton, ...styles.linkButton }}>
            Back
          </Link>

          <h1 style={styles.heroTitle}>{heading}</h1>

          <div style={styles.termColumn}>
            {TERMS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTerm(t)}
                disabled={t === term}
                style={{
                  ...styles.secondaryButton,
                  ...styles.termButton,
                  ...(t === term ? styles.activeTermButton : {}),
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={styles.courseList}>
            {Array.from(colorMap.entries()).map(([courseKey, color]) => (
              <div key={courseKey} style={styles.courseListItem}>
                <span style={{ ...styles.colorSwatch, backgroundColor: color }} />
                <span>{courseKey}</span>
              </div>
            ))}
          </div>
        </aside>

        <main style={styles.calendarArea}>
          {error ? <p>{error}</p> : <CalendarView courses={courses} colorMap={colorMap} />}
        </main>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    height: "100vh",
    padding: "32px 20px",
    boxSizing: "border-box",
    background:
      "radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 28%), linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%)",
  },
  shell: {
    maxWidth: "1400px",
    height: "100%",
    margin: "0 auto",
    display: "flex",
    gap: "24px",
  },
  sidebar: {
    width: "260px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflowY: "auto",
  },
  heroTitle: {
    margin: 0,
    fontSize: "clamp(2rem, 3.5vw, 3rem)",
    lineHeight: 1.05,
    color: "#0f172a",
  },
  termColumn: {
    display: "flex",
    flexDirection: "row",
    gap: "6px",
  },
  termButton: {
    flex: 1,
    minWidth: 0,
    padding: "0 6px",
    fontSize: "13px",
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
  activeTermButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "1px solid #2563eb",
  },
  linkButton: {
    textDecoration: "none",
  },
  courseList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  courseListItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  colorSwatch: {
    display: "inline-block",
    width: "12px",
    height: "12px",
    borderRadius: "2px",
    flexShrink: 0,
  },
  calendarArea: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
};