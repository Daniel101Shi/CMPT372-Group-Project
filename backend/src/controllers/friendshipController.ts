import type { Request, Response } from "express";

import { pool } from "../db/db.js";

type FriendshipBody = {
  requesterId?: number;
  recipientId?: number;
};

function getFriendshipIds(req: Request, res: Response) {
  const { requesterId, recipientId } = req.body as FriendshipBody;

  if (!Number.isInteger(requesterId) || !Number.isInteger(recipientId)) {
    res.status(400).json({
      error: "requesterId and recipientId must both be integers.",
    });
    return null;
  }

  if (requesterId === recipientId) {
    res.status(400).json({
      error: "requesterId and recipientId must be different users.",
    });
    return null;
  }

  return { requesterId, recipientId };
}

export async function sendFriendRequest(req: Request, res: Response) {
  const ids = getFriendshipIds(req, res);

  if (!ids) {
    return;
  }

  const { requesterId, recipientId } = ids;

  try {
    const usersResult = await pool.query(
      `
        SELECT user_id
        FROM users
        WHERE user_id = $1 OR user_id = $2
      `,
      [requesterId, recipientId],
    );

    if (usersResult.rowCount !== 2) {
      return res.status(404).json({
        error: "One or both users do not exist.",
      });
    }

    const existingFriendshipResult = await pool.query(
      `
        SELECT user_id_1, user_id_2, pending
        FROM friendships
        WHERE (user_id_1 = $1 AND user_id_2 = $2)
           OR (user_id_1 = $2 AND user_id_2 = $1)
      `,
      [requesterId, recipientId],
    );

    if (existingFriendshipResult.rowCount && existingFriendshipResult.rowCount > 0) {
      const existingFriendship = existingFriendshipResult.rows[0] as {
        pending: boolean;
      };

      return res.status(409).json({
        error: existingFriendship.pending
          ? "A friendship request already exists between these users."
          : "These users are already friends.",
      });
    }

    const insertResult = await pool.query(
      `
        INSERT INTO friendships (user_id_1, user_id_2, pending)
        VALUES ($1, $2, TRUE)
        RETURNING user_id_1, user_id_2, pending
      `,
      [requesterId, recipientId],
    );

    return res.status(201).json({
      message: "Friendship request created successfully.",
      friendship: insertResult.rows[0],
    });
  } catch (error) {
    console.error("Failed to create friendship request:", error);
    return res.status(500).json({
      error: "Internal server error.",
    });
  }
}

export async function acceptFriendRequest(req: Request, res: Response) {
  const ids = getFriendshipIds(req, res);

  if (!ids) {
    return;
  }

  const { requesterId, recipientId } = ids;

  try {
    const existingFriendshipResult = await pool.query(
      `
        SELECT user_id_1, user_id_2, pending
        FROM friendships
        WHERE user_id_1 = $1 AND user_id_2 = $2
      `,
      [requesterId, recipientId],
    );

    if (!existingFriendshipResult.rowCount || existingFriendshipResult.rowCount === 0) {
      return res.status(404).json({
        error: "Friendship request not found.",
      });
    }

    const existingFriendship = existingFriendshipResult.rows[0] as {
      pending: boolean;
    };

    if (!existingFriendship.pending) {
      return res.status(409).json({
        error: "These users are already friends.",
      });
    }

    const updatedFriendshipResult = await pool.query(
      `
        UPDATE friendships
        SET pending = FALSE
        WHERE user_id_1 = $1 AND user_id_2 = $2
        RETURNING user_id_1, user_id_2, pending
      `,
      [requesterId, recipientId],
    );

    return res.status(200).json({
      message: "Friendship request accepted successfully.",
      friendship: updatedFriendshipResult.rows[0],
    });
  } catch (error) {
    console.error("Failed to accept friendship request:", error);
    return res.status(500).json({
      error: "Internal server error.",
    });
  }
}

export async function deleteFriendship(req: Request, res: Response) {
  const ids = getFriendshipIds(req, res);

  if (!ids) {
    return;
  }

  const { requesterId, recipientId } = ids;

  try {
    const existingFriendshipResult = await pool.query(
      `
        SELECT user_id_1, user_id_2, pending
        FROM friendships
        WHERE (user_id_1 = $1 AND user_id_2 = $2)
           OR (user_id_1 = $2 AND user_id_2 = $1)
      `,
      [requesterId, recipientId],
    );

    if (!existingFriendshipResult.rowCount || existingFriendshipResult.rowCount === 0) {
      return res.status(404).json({
        error: "Friendship not found.",
      });
    }

    const deletedFriendshipResult = await pool.query(
      `
        DELETE FROM friendships
        WHERE (user_id_1 = $1 AND user_id_2 = $2)
           OR (user_id_1 = $2 AND user_id_2 = $1)
        RETURNING user_id_1, user_id_2, pending
      `,
      [requesterId, recipientId],
    );

    return res.status(200).json({
      message: "Friendship deleted successfully.",
      friendship: deletedFriendshipResult.rows[0],
    });
  } catch (error) {
    console.error("Failed to delete friendship:", error);
    return res.status(500).json({
      error: "Internal server error.",
    });
  }
}
