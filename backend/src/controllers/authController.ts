import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db/db.js";
import { authErrors } from "../error_messages/auth.js";
import { authValidation } from "./validation/auth.js";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    username?: string;
  }
}

// postgres unique_violation. the UNIQUE constraint on users.username is the real guard
// against duplicates; the SELECT below is only a nicety, since two simultaneous signups
// can both pass it before either one inserts.
const PG_UNIQUE_VIOLATION = "23505";

//user registering
export async function register(req: Request, res: Response) {
    // express.json() leaves req.body undefined when Content-Type isn't json, and
    // destructuring undefined throws, which express renders as an html stack trace.
    if (!authValidation.isObjectBody(req.body)) {
        return authErrors.malformedBodyResponse(res);
    }

    const unknownKey = authValidation.rejectUnknownKeys(req.body, [
        "username",
        "password",
        "contactInfo",
    ]);
    if (unknownKey) {
        return authErrors.invalidInputResponse(res, unknownKey);
    }

    const { username, password, contactInfo } = req.body;

    const failure =
        authValidation.validateUsername(username) ??
        authValidation.validatePassword(password) ??
        authValidation.validateContactInfo(contactInfo);
    if (failure) {
        return authErrors.invalidInputResponse(res, failure);
    }

    const cleanUsername = (username as string).trim();
    const cleanContactInfo =
        typeof contactInfo === "string" && contactInfo.trim().length > 0
            ? contactInfo.trim()
            : null;

    try {
        const existingUserResult = await pool.query(
            'SELECT user_id FROM users WHERE username = $1', [cleanUsername]
        );
        if (existingUserResult.rowCount && existingUserResult.rowCount > 0) {
            return authErrors.usernameTakenResponse(res);
        }

        const passwordHash = await bcrypt.hash(password as string, 10); // 10 is how many times the algo scrambles password
        const insertResult = await pool.query(
        `
            INSERT INTO users (username, password_hash, contact_info)
            VALUES ($1, $2, $3)
            RETURNING user_id, username, contact_info, role
        `,
        [cleanUsername, passwordHash, cleanContactInfo]
        );
        const newUser = insertResult.rows[0];

        //exact moment user is actually logged in
        req.session.userId = newUser.user_id;
        req.session.username = newUser.username;

        return res.status(201).json({
            message: "User registered successfully.",
            user: newUser,
        });
    } catch (error) {
        // lost the race against another signup with the same name
        if (typeof error === "object" && error !== null && (error as { code?: string }).code === PG_UNIQUE_VIOLATION) {
            return authErrors.usernameTakenResponse(res);
        }
        console.error("Registration error:", error);
        return authErrors.internalErrorResponse(res);
    }
}

export async function login(req: Request, res: Response) {
    if (!authValidation.isObjectBody(req.body)) {
        return authErrors.malformedBodyResponse(res);
    }

    const { username, password } = req.body;

    // deliberately not run through the full validators. those enforce the current rules,
    // and an account made under older rules must still be able to log in.
    if (typeof username !== "string" || typeof password !== "string" || username.trim().length === 0 || password.length === 0) {
        return authErrors.invalidCredentialsResponse(res);
    }

    const cleanUsername = username.trim();
    try {
        const userResult = await pool.query(
        `SELECT user_id, username, password_hash, contact_info, campus_schedule, created_at, role FROM users WHERE username = $1`,
        [cleanUsername]
        );
        if (!userResult.rowCount || userResult.rowCount === 0) {
            return authErrors.invalidCredentialsResponse(res);
        }
        const user = userResult.rows[0];

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return authErrors.invalidCredentialsResponse(res);
        }

        req.session.userId = user.user_id;
        req.session.username = user.username;
        //strip password hash and create new obj called userWithoutPassword
        const { password_hash, ...userWithoutPassword } = user;

        return res.status(200).json({
            message: "Logged in successfully.",
            user: userWithoutPassword,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return authErrors.internalErrorResponse(res);
    }
}

export async function logout(req: Request, res: Response) {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return authErrors.failedLogoutResponse(res);
        }
        res.clearCookie("connect.sid");
        return res.status(200).json({ message: "Logged out successfully." });
    });
}

export async function getCurrentUser(req: Request, res: Response) {
    // 200 with user:null rather than 401. this is a "who am i" probe the app calls on every
    // page load, and being logged out is a normal answer, not an error.
    if (!req.session.userId) {
        return res.status(200).json({ user: null });
    }
    try {
        const userResult = await pool.query(
            `SELECT user_id, username, contact_info, campus_schedule, created_at, role FROM users WHERE user_id = $1`,
            [req.session.userId]
        );
        if (!userResult.rowCount || userResult.rowCount === 0) {
            // session points at a deleted account
            req.session.destroy(() => {});
            return res.status(200).json({ user: null });
        }
        return res.status(200).json({ user: userResult.rows[0] });
    } catch (error) {
        console.error("Get current user error:", error);
        return authErrors.internalErrorResponse(res);
    }
}
