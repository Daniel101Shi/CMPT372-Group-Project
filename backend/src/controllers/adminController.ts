import type { Request, Response } from "express";

import { pool } from "../db/db.js";
import { adminErrors } from "../error_messages/admin.js";
import { authErrors } from "../error_messages/auth.js";
import { authValidation } from "./validation/auth.js";
import { adminValidation } from "./validation/admin.js";

// Every handler here sits behind requireAuth + requireRole("admin") (see adminRoutes.ts),
// so by the time one runs the caller is known to be a logged in admin.

const LIST_USERS = `
    SELECT
        u.user_id,
        u.username,
        u.contact_info,
        u.role,
        u.created_at,
        (SELECT COUNT(*)::int FROM packs p WHERE p.owner_id = u.user_id) AS pack_count,
        (SELECT COUNT(*)::int FROM friendships f
           WHERE (f.user_id_1 = u.user_id OR f.user_id_2 = u.user_id)
             AND f.pending = FALSE) AS friend_count
    FROM users u
    ORDER BY u.user_id
`;

const COUNT_ADMINS = `SELECT COUNT(*)::int AS admin_count FROM users WHERE role = 'admin'`;

export async function listUsers(_req: Request, res: Response) {
    try {
        // password_hash is deliberately not selected. an admin has no reason to see it and
        // it should never leave the database.
        const result = await pool.query(LIST_USERS);
        return res.status(200).json({ users: result.rows });
    } catch (error) {
        console.error("listUsers error:", error);
        return adminErrors.failedListUsersResponse(res);
    }
}

export async function updateUserRole(req: Request, res: Response) {
    const targetUserId = Number(req.params.userId);
    if (!adminValidation.isValidUserId(targetUserId)) {
        return adminErrors.invalidUserIdResponse(res);
    }

    if (!authValidation.isObjectBody(req.body)) {
        return authErrors.malformedBodyResponse(res);
    }

    const unknownKey = authValidation.rejectUnknownKeys(req.body, ["role"]);
    if (unknownKey) {
        return authErrors.invalidInputResponse(res, unknownKey);
    }

    const { role } = req.body;
    if (!adminValidation.isValidRole(role)) {
        return adminErrors.invalidRoleResponse(res);
    }

    try {
        const targetResult = await pool.query(
            `SELECT user_id, role FROM users WHERE user_id = $1`,
            [targetUserId],
        );
        if (!targetResult.rowCount || targetResult.rowCount === 0) {
            return adminErrors.userNotFoundResponse(res);
        }

        const currentRole = targetResult.rows[0].role;

        // demoting the only admin would leave nobody able to promote anyone back
        if (currentRole === "admin" && role !== "admin") {
            const countResult = await pool.query(COUNT_ADMINS);
            if (countResult.rows[0].admin_count <= 1) {
                return adminErrors.lastAdminResponse(res);
            }
        }

        const updateResult = await pool.query(
            `UPDATE users SET role = $2 WHERE user_id = $1
             RETURNING user_id, username, contact_info, role, created_at`,
            [targetUserId, role],
        );

        return res.status(200).json({ user: updateResult.rows[0] });
    } catch (error) {
        console.error("updateUserRole error:", error);
        return adminErrors.failedUpdateRoleResponse(res);
    }
}

export async function deleteUser(req: Request, res: Response) {
    const targetUserId = Number(req.params.userId);
    if (!adminValidation.isValidUserId(targetUserId)) {
        return adminErrors.invalidUserIdResponse(res);
    }

    // deleting yourself would destroy the session mid-request and is never what you meant
    if (targetUserId === req.session.userId) {
        return adminErrors.cannotDeleteSelfResponse(res);
    }

    try {
        const targetResult = await pool.query(
            `SELECT user_id, role FROM users WHERE user_id = $1`,
            [targetUserId],
        );
        if (!targetResult.rowCount || targetResult.rowCount === 0) {
            return adminErrors.userNotFoundResponse(res);
        }

        if (targetResult.rows[0].role === "admin") {
            const countResult = await pool.query(COUNT_ADMINS);
            if (countResult.rows[0].admin_count <= 1) {
                return adminErrors.lastAdminResponse(res);
            }
        }

        // packs, friendships, and course collections all cascade from the users FK
        await pool.query(`DELETE FROM users WHERE user_id = $1`, [targetUserId]);

        return res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
        console.error("deleteUser error:", error);
        return adminErrors.failedDeleteUserResponse(res);
    }
}
