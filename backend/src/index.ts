import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import friendshipRoutes from "./routes/friendshipRoutes.js";
import packRoutes from "./routes/packRoutes.js"

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", friendshipRoutes);
app.use("/api", packRoutes);

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
