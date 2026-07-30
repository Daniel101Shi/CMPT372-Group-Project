import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { CalendarView } from "./CalendarView";
import { buildCourseColorMap } from "./courseColors";
import { useSchedulePdfExport } from "./topdf";
import type { Course } from "./types";


// used AI for matching CSS with the home screen and the calendar view

type Term = "spring" | "summer" | "fall";

// must match the backend's hardcoded CURRENT_YEAR (getUserCourseController.ts)
const CURRENT_YEAR = 2026;


// used for friend's schedule, accessed through friend
type FriendSchedule = {
  userId: number;
  username: string;
  courses: Course[];
};

const TERMS: Term[] = ["spring", "summer", "fall"];

const API_URL = import.meta.env.VITE_API_URL || "";

export const ScheduleViewerComponent: React.FC = () => {
  const { user } = useAuth();
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
    
    // get all friend's course schedules. but only render that one friend with matching ID
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

  // colorMap = course key + color
  const colorMap = useMemo(() => buildCourseColorMap(courses), [courses]);
  
  // url for back button
  const backTo = friendUserId ? `/userprofile/${friendUserId}` : "/userprofile";

  // custom heading
  const heading = ownerUsername ? `${ownerUsername}'s Calendar` : "Calendar";

  // print-only heading: "{username} {Semester} {year}"
  const displayName = ownerUsername ?? user?.username ?? "";
  const termLabel = term.charAt(0).toUpperCase() + term.slice(1);
  const printHeading = `${displayName} ${termLabel} ${CURRENT_YEAR}`;

  const { printRef, exportToPdf } = useSchedulePdfExport(`${heading} - ${term}`);

  return (
    <div style={styles.page}>
      <div style={styles.shell} className="schedule-print-shell" ref={printRef}>
        <aside style={styles.sidebar}>
          <Link
            to={backTo}
            className="no-print"
            style={{ ...styles.secondaryButton, ...styles.linkButton }}
          >
            Back
          </Link>

          <div style={styles.titleRow}>
            <h1 className="no-print" style={styles.heroTitle}>
              {heading}
            </h1>
            <h1 className="print-only" style={{ ...styles.heroTitle, display: "none" }}>
              {printHeading}
            </h1>
            <button
              type="button"
              className="no-print"
              onClick={() => exportToPdf()}
              style={{ ...styles.secondaryButton, ...styles.exportButton }}
            >
              Export PDF
            </button>
          </div>

          <div style={styles.termColumn} className="no-print">
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
          {/* double error check */}
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
  titleRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },
  heroTitle: {
    margin: 0,
    fontSize: "clamp(2rem, 3.5vw, 3rem)",
    lineHeight: 1.05,
    color: "#0f172a",
  },
  exportButton: {
    minHeight: "34px",
    padding: "0 12px",
    fontSize: "13px",
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