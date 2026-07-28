import type { Request, Response } from "express";

import { pool } from "../db/db.js";

export const CURRENT_YEAR = "2026";

export type Term = "spring" | "summer" | "fall";

export const VALID_TERMS: Term[] = ["spring", "summer", "fall"];

export function isTerm(value: string): value is Term {
  return (VALID_TERMS as string[]).includes(value);
}

export function parseTermParam(req: Request): string {
  const rawTerm = req.params.term;
  return Array.isArray(rawTerm) ? (rawTerm[0] ?? "") : (rawTerm ?? "");
}

function getSessionUserId(req: Request, res: Response) {
  const userId = req.session.userId;

  if (!userId) {
    res.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "You must be logged in to view courses.",
      },
    });
    return null;
  }

  return userId;
}

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

export async function fetchCoursesForUser(userId: number, term: Term) {
  const coursesResult = await pool.query<SavedCourseRow>(
    `
      SELECT sc.department, sc.course_number, sc.section
      FROM course_collection_items cci
      JOIN saved_courses sc ON sc.course_id = cci.course_id
      WHERE cci.user_id = $1
        AND cci.semester = $2
        AND cci.year = $3
    `,
    [userId, term, Number(CURRENT_YEAR)],
  );

  return Promise.all(
    coursesResult.rows.map(async (row) => {
      const outline = await getCourseOutline(
        CURRENT_YEAR,
        term,
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
}

// Endpoint 1: GET /api/getcourse/:term - the logged-in user's own courses
export async function getUserCourse(req: Request, res: Response) {
  const sessionUserId = getSessionUserId(req, res);

  if (!sessionUserId) {
    return;
  }

  const term = parseTermParam(req);

  if (!isTerm(term)) {
    return res.status(400).json({
      error: {
        code: "INVALID_TERM",
        message: "term must be one of: spring, summer, fall.",
      },
    });
  }

  try {
    const courses = await fetchCoursesForUser(sessionUserId, term);
    return res.status(200).json({ courses });
  } catch (error) {
    console.error("Failed to fetch user courses:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error.",
      },
    });
  }
}