import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";

import { pool } from "./db/db.js";

import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import friendshipRoutes from "./routes/friendshipRoutes.js";
import packRoutes from "./routes/packRoutes.js"
import userRoutes from "./routes/userRoutes.js";

// getUserCourse
import getUserCourseRoutes from "./routes/getUserCourseRoutes.js";
import getFriendCourseRoutes from "./routes/getFriendCourseRoutes.js";
import { scheduleRoutes } from "./routes/scheduleRoutes.js";

import { testConnection, shutdown } from "./db/testDB.js";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// no fallback in production. a default secret means anyone who has read the source can forge
// a session cookie, so we refuse to boot instead of silently running insecurely.
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && isProduction) {
  throw new Error("SESSION_SECRET must be set when NODE_ENV=production");
}

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// sessions live in postgres, not in memory. the default MemoryStore drops every session on
// restart (so everyone gets logged out on a redeploy) and leaks memory as sessions pile up.
const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 60, // clean out expired rows hourly
    }),
    secret: sessionSecret || "lopo-dev-only-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: isProduction ? "none" : "lax",
    },
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// mounted on its own prefix, not "/api", because adminRoutes gates itself with a bare
// router.use() that would otherwise apply to every /api request
app.use("/api/admin", adminRoutes);
app.use("/api", authRoutes);
app.use("/api", friendshipRoutes);
app.use("/api", packRoutes);
app.use("/api", userRoutes);

// getUserCourse
app.use("/api", getUserCourseRoutes);
app.use("/api", getFriendCourseRoutes);
app.use("/api", scheduleRoutes);





async function startServer(){
  try{
    await testConnection();
    console.log("Connected to PostgreSQL")
    app.listen(port, "0.0.0.0", () => {
      console.log(`Backend listening on port ${port}`);
    });
  }catch(error){
    console.error("Failed to connect to PostgreSQL:", error);
    process.exit(1);
  }
}

startServer();
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));