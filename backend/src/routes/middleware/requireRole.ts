import { type NextFunction, type Request, type Response } from "express";

import { pool } from "../../db/db.js";
import { authErrors } from "../../error_messages/auth.js";
import { type Role } from "../../types/User.js";

/**
 * Gate a route on the caller's role.
 *
 *   router.use(requireAuth, requireRole("admin"));
 *
 * Pair it with requireAuth, which answers "are you logged in at all". This answers the
 * separate question of "are you allowed", so an anonymous request gets 401 and a logged-in
 * request from the wrong kind of user gets 403.
 *
 * The role is read from the database on every request rather than cached in the session.
 * That costs one small indexed lookup, and it buys immediate revocation: demoting an admin
 * takes effect on their very next request instead of whenever they next log in. A session
 * can live for 7 days, which is a long time to keep powers you were supposed to lose.
 */
export function requireRole(...allowed: Role[]) {
    return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
        // defensive. normally requireAuth runs first and has already handled this.
        if (!req.session.userId) {
            authErrors.unauthorizedResponse(res);
            return;
        }

        try {
            const result = await pool.query(
                `SELECT role FROM users WHERE user_id = $1`,
                [req.session.userId],
            );

            // session outlived the account it points at
            if (!result.rowCount || result.rowCount === 0) {
                req.session.destroy(() => {});
                authErrors.unauthorizedResponse(res);
                return;
            }

            const role = result.rows[0].role as Role;
            if (!allowed.includes(role)) {
                authErrors.forbiddenResponse(res);
                return;
            }

            next();
        } catch (error) {
            console.error("requireRole error:", error);
            authErrors.internalErrorResponse(res);
        }
    };
}
