import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import friendshipRoutes from "./routes/friendshipRoutes.js";

// getUserCourse
import getUserCourseRoutes from "./routes/getUserCourseRoutes.js";


dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", friendshipRoutes);

// getUserCourse
app.use("/api", getUserCourseRoutes);


app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
