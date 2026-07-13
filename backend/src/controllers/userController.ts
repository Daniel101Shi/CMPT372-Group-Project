import type { Request, Response } from "express";

import { pool } from "../db/db.js";

type RelationshipStatus =
  | "self"
  | "none"
  | "friends"
  | "incoming_request"
  | "outgoing_request";

function getSessionUserId(req: Request, res: Response) {
  const userId = req.session.userId;

  if (!userId) {
    res.status(401).json({
      error: "You must be logged in to view profiles.",
    });
    return null;
  }

  return userId;
}

export async function searchUsers(req: Request, res: Response) {
  const sessionUserId = getSessionUserId(req, res);

  if (!sessionUserId) {
    return;
  }

  const rawQuery = typeof req.query.query === "string" ? req.query.query : "";
  const query = rawQuery.trim();

  if (query.length < 1) {
    return res.status(200).json({ users: [] });
  }

  try {
    const usersResult = await pool.query(
      `
        SELECT
          u.user_id,
          u.username,
          (
            SELECT COUNT(*)
            FROM packs p
            WHERE p.owner_id = u.user_id
          )::int AS pack_count
        FROM users u
        WHERE u.username ILIKE $1
        ORDER BY
          CASE
            WHEN LOWER(u.username) = LOWER($2) THEN 0
            WHEN LOWER(u.username) LIKE LOWER($2) || '%' THEN 1
            ELSE 2
          END,
          u.username ASC
        LIMIT 8
      `,
      [`%${query}%`, query],
    );

    return res.status(200).json({
      users: usersResult.rows.map((row) => ({
        user_id: row.user_id,
        username: row.username,
        packCount: row.pack_count,
        isOwnProfile: row.user_id === sessionUserId,
      })),
    });
  } catch (error) {
    console.error("Failed to search users:", error);
    return res.status(500).json({
      error: "Internal server error.",
    });
  }
}

export async function getUserProfile(req: Request, res: Response) {
  const sessionUserId = getSessionUserId(req, res);

  if (!sessionUserId) {
    return;
  }

  const targetUserId = Number(req.params.userId);

  if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
    return res.status(400).json({
      error: "A valid user id is required.",
    });
  }

  try {
    const profileResult = await pool.query(
      `
        SELECT
          u.user_id,
          u.username,
          u.contact_info,
          u.created_at,
          (
            SELECT COUNT(*)
            FROM packs p
            WHERE p.owner_id = u.user_id
          )::int AS pack_count,
          (
            SELECT COUNT(*)
            FROM friendships f
            WHERE (f.user_id_1 = u.user_id OR f.user_id_2 = u.user_id)
              AND f.pending = FALSE
          )::int AS friends_count
        FROM users u
        WHERE u.user_id = $1
      `,
      [targetUserId],
    );

    if (!profileResult.rowCount || profileResult.rowCount === 0) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    const profile = profileResult.rows[0] as {
      user_id: number;
      username: string;
      contact_info: string | null;
      created_at: string;
      pack_count: number;
      friends_count: number;
    };

    const isOwnProfile = targetUserId === sessionUserId;

    let relationshipStatus: RelationshipStatus = isOwnProfile ? "self" : "none";

    if (!isOwnProfile) {
      const relationshipResult = await pool.query(
        `
          SELECT user_id_1, user_id_2, pending
          FROM friendships
          WHERE (user_id_1 = $1 AND user_id_2 = $2)
             OR (user_id_1 = $2 AND user_id_2 = $1)
        `,
        [sessionUserId, targetUserId],
      );

      if (relationshipResult.rowCount && relationshipResult.rowCount > 0) {
        const relationship = relationshipResult.rows[0] as {
          user_id_1: number;
          user_id_2: number;
          pending: boolean;
        };

        if (!relationship.pending) {
          relationshipStatus = "friends";
        } else if (relationship.user_id_1 === sessionUserId) {
          relationshipStatus = "outgoing_request";
        } else {
          relationshipStatus = "incoming_request";
        }
      }
    }

    const canViewContactInfo = isOwnProfile || relationshipStatus === "friends";

    return res.status(200).json({
      profile: {
        user_id: profile.user_id,
        username: profile.username,
        contact_info: canViewContactInfo ? profile.contact_info : null,
        created_at: profile.created_at,
        packCount: profile.pack_count,
        friendsCount: profile.friends_count,
        isOwnProfile,
        relationshipStatus,
        canViewContactInfo,
      },
    });
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return res.status(500).json({
      error: "Internal server error.",
    });
  }
}
