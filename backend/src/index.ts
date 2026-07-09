import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import {
  acceptFriendRequest,
  deleteFriendship,
  sendFriendRequest,
} from "./handlers/friendshipHandlers.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/api/friendship/request", sendFriendRequest);

app.patch("/api/friendships/accept", acceptFriendRequest);

app.delete("/api/friendships", deleteFriendship);

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
