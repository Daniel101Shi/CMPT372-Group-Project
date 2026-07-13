import express from "express";

import {
  acceptFriendRequest,
  deleteFriendship,
  getFriendshipDashboard,
  sendFriendRequest,
} from "../controllers/friendshipController.js";

const router = express.Router();

router.get("/friendships", getFriendshipDashboard);
router.post("/friendship/request", sendFriendRequest);
router.patch("/friendships/accept", acceptFriendRequest);
router.delete("/friendships", deleteFriendship);

export default router;
