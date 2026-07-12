import type { Request, Response } from "express";

import { pool } from "../db/db.js";

const CURRENT_SEMESTER = "2026summer";

type Term = "spring" | "summer" | "fall";

const SEMESTER_MATCH = /^(\d{4})(spring|summer|fall)$/.exec(CURRENT_SEMESTER);

if (!SEMESTER_MATCH) {
  throw new Error(
    `CURRENT_SEMESTER "${CURRENT_SEMESTER}" is not in the expected "<year><term>" format.`,
  );
}

const CURRENT_YEAR = SEMESTER_MATCH[1] as string;
const CURRENT_TERM = SEMESTER_MATCH[2] as Term;

// SFU course outline API types (https://www.sfu.ca/outlines/help/api.html)

interface ScheduleItem {
  startTime: string; // e.g., "10:30"
  endTime: string; // e.g., "12:20"
  days: string; // e.g., "Mo, We"
  sectionCode: string; // e.g., "LEC", "TUT", "LAB"
  campus: string; // e.g., "Burnaby"
  roomCode?: string; // e.g., "ASB 9700"
}

interface CourseOutline {
  info: {
    name: string; // e.g., "CMPT 120 D100"
    title: string;
  };
  courseSchedule?: ScheduleItem[];
}

async function getCourseOutline(
  year: string,
  term: Term,
  department: string,
  courseNumber: string,
  section: string,
): Promise<CourseOutline | null> {
  const baseUrl = "https://www.sfu.ca/bin/wcm/course-outlines";
  const url = `${baseUrl}?${year}/${term}/${department.toLowerCase()}/${courseNumber}/${section.toLowerCase()}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`SFU course outline request failed with status ${response.status}`);
  }

  return (await response.json()) as CourseOutline;
}

type SavedCourseRow = {
  department: string;
  course_number: string;
  section: string;
};

export async function getUserCourses(req: Request, res: Response) {
  const userId = Number(req.params.userId);

  if (!Number.isInteger(userId)) {
    return res.status(400).json({
      error: "userId must be an integer.",
    });
  }

  try {
    const userResult = await pool.query(
      `
        SELECT user_id
        FROM users
        WHERE user_id = $1
      `,
      [userId],
    );

    if (userResult.rowCount !== 1) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    const coursesResult = await pool.query<SavedCourseRow>(
      `
        SELECT sc.department, sc.course_number, sc.section
        FROM course_collection_items cci
        JOIN saved_courses sc ON sc.course_id = cci.course_id
        WHERE cci.user_id = $1
          AND cci.semester = $2
          AND cci.year = $3
      `,
      [userId, CURRENT_TERM, Number(CURRENT_YEAR)],
    );

    const courses = await Promise.all(
      coursesResult.rows.map(async (row) => {
        const outline = await getCourseOutline(
          CURRENT_YEAR,
          CURRENT_TERM,
          row.department,
          row.course_number,
          row.section,
        );

        return {
          department: row.department,
          courseNumber: row.course_number,
          section: row.section,
          title: outline?.info.title ?? null,
          schedule: outline?.courseSchedule ?? [],
        };
      }),
    );

    return res.status(200).json({ courses });
  } catch (error) {
    console.error("Failed to fetch user courses:", error);
    return res.status(500).json({
      error: "Internal server error.",
    });
  }
}
