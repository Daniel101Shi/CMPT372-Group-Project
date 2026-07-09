import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { pool } from "./db.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/api/friendship/request", async (req, res) => {
  const { requesterId, recipientId } = req.body as {
    requesterId?: number;
    recipientId?: number;
  };

  if (!Number.isInteger(requesterId) || !Number.isInteger(recipientId)) {
    return res.status(400).json({
      error: "requesterId and recipientId must both be integers.",
    });
  }

  if (requesterId === recipientId) {
    return res.status(400).json({
      error: "You cannot send a friendship request to yourself.",
    });
  }

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
});

app.patch("/api/friendships/accept", async (req, res) => {
  const { requesterId, recipientId } = req.body as {
    requesterId?: number;
    recipientId?: number;
  };

  if (!Number.isInteger(requesterId) || !Number.isInteger(recipientId)) {
    return res.status(400).json({
      error: "requesterId and recipientId must both be integers.",
    });
  }

  if (requesterId === recipientId) {
    return res.status(400).json({
      error: "A user cannot accept their own friendship request.",
    });
  }

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
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
