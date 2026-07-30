import type { Request, Response } from "express";

import { pool } from "../db/db.js";
import {
  fetchCoursesForUser,
  isTerm,
  parseTermParam,
  getSessionUserId,
} from "./getUserCourseController.js";

type FriendRow = {
  user_id: number;
  username: string;
};

// Reserve: for displaying all friend's course, not just a single pack's schedule.

// Endpoint 2: GET /api/getfriendscourse/:term - the logged-in user's
// courses plus the courses of every confirmed friend, combined into one JSON payload.
export async function getFriendsCourses(req: Request, res: Response) {
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
  // end of authentication

  
  try {
    // logged-in user's confirmed friends, not including the user
    // not including pending friendships
    const friendsResult = await pool.query<FriendRow>(
      `
        SELECT
          u.user_id,
          u.username
        FROM friendships f
        JOIN users u
          ON u.user_id = CASE
            WHEN f.user_id_1 = $1 THEN f.user_id_2
            ELSE f.user_id_1
          END
        WHERE (f.user_id_1 = $1 OR f.user_id_2 = $1)
          AND f.pending = FALSE
        ORDER BY u.username ASC
      `,
      [sessionUserId],
    );

    // get users
    const selfResult = await pool.query<FriendRow>(
      `
        SELECT user_id, username
        FROM users
        WHERE user_id = $1
      `,
      [sessionUserId],
    );
    
    // combine the logged-in user and their friends into one array
    const people = [...selfResult.rows, ...friendsResult.rows];

    // get courses for each person
    // from getUserCourseController.ts
    const schedules = await Promise.all(
      people.map(async (person) => ({
        userId: person.user_id,
        username: person.username,
        courses: await fetchCoursesForUser(person.user_id, term),
      })),
    );

    return res.status(200).json({ schedules });
  } catch (error) {
    console.error("Failed to fetch friends' courses:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error.",
      },
    });
  }
}