import express from "express";

import { getUserProfile, searchUsers } from "../controllers/userController.js";

const router = express.Router();

router.get("/users/search", searchUsers);
router.get("/users/:userId/profile", getUserProfile);

export default router;
