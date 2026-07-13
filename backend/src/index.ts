import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";

import authRoutes from "./routes/authRoutes.js";
import friendshipRoutes from "./routes/friendshipRoutes.js";
import packRoutes from "./routes/packRoutes.js"

// getUserCourse
import getUserCourseRoutes from "./routes/getUserCourseRoutes.js";


dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "lopo-super-secure-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", authRoutes);
app.use("/api", friendshipRoutes);
app.use("/api", packRoutes);

// getUserCourse
app.use("/api", getUserCourseRoutes);


app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
