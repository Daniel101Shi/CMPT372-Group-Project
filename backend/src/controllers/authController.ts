import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db.js"

declare module "express-session" {
  interface SessionData {
    userId?: number;
    username?: string;
  }
}

//left optional to be extra defensive
type AuthBody = {
  username?: string;
  password?: string;
  contactInfo?: string;
};

//user registering
export async function register(req: Request , res: Response) {
    const {username, password, contactInfo} = req.body as AuthBody; //
    //validating the input :)
    if (!username || typeof username !== "string" || username.trim().length === 0){
        return res.status(400).json( {error: "Username is needed"})}
    if (!password || typeof password !== "string" || password.length < 4) {
        return res.status(400).json({ error: "Password must be at least 4 characters long." });}
    const cleanUsername = username.trim();
    const cleanContactInfo = typeof contactInfo === "string" ? contactInfo.trim() : null;


    try {
        const existingUserResult = await pool.query(
            'SELECT user_id FROM users WHERE username = $1', [cleanUsername]
        );
        if (existingUserResult.rowCount && existingUserResult.rowCount > 0) {
        return res.status(409).json({ error: "Username already exists." }
        );
        }
        const passwordHash = await bcrypt.hash(password, 10); // 10 is how many times the algo scrambles password
        const insertResult = await pool.query(
        `
            INSERT INTO users (username, password_hash, contact_info)
            VALUES ($1, $2, $3)
            RETURNING user_id, username, contact_info
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
            console.error("Registration error:", error);
            return res.status(500).json({ error: "Internal server error." });
    }
}

export async function login(req: Request, res: Response){
    const { username, password } = req.body as AuthBody;

    if (!username || typeof username !== "string" || !password || typeof password !== "string") {
        return res.status(400).json({ error: "Username and password are required." });
    }
    const cleanUsername = username.trim();
    try {
        const userResult = await pool.query(
        `SELECT user_id, username, password_hash, contact_info, campus_schedule, created_at FROM users WHERE username = $1`,
        [cleanUsername]
        );
        if (!userResult.rowCount || userResult.rowCount === 0) {
        return res.status(401).json({ error: "Invalid username or password." });
        }
        const user = userResult.rows[0];
        
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid username or password." });
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
    catch (error){
        console.error("Login error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}

export async function logout(req: Request, res: Response){
    req.session.destroy((err) =>{
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ error: "Failed to logout." });
        }
        res.clearCookie("connect.sid");
        return res.status(200).json({ message: "Logged out successfully." });
    });
}

export async function getCurrentUser(req: Request, res: Response){
    if (!req.session.userId) {
        return res.status(200).json({ user: null });
    }
    try {
        const userResult = await pool.query(
            `SELECT user_id, username, contact_info, campus_schedule, created_at FROM users WHERE user_id = $1`,
            [req.session.userId]
        );
        if (!userResult.rowCount || userResult.rowCount === 0) {
            req.session.destroy(() => {});
            return res.status(200).json({ user: null });
        }
        return res.status(200).json({ user: userResult.rows[0] });
    } catch (error) {
        console.error("Get current user error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }

}