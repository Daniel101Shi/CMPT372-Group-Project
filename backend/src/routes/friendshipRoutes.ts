import express from "express";

import {
  acceptFriendRequest,
  deleteFriendship,
  sendFriendRequest,
} from "../controllers/friendshipController.js";

const router = express.Router();

router.post("/friendship/request", sendFriendRequest);
router.patch("/friendships/accept", acceptFriendRequest);
router.delete("/friendships", deleteFriendship);

export default router;
