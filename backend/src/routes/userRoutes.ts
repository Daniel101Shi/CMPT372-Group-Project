import express from "express";

import { getUserProfile } from "../controllers/userController.js";

const router = express.Router();

router.get("/users/:userId/profile", getUserProfile);

export default router;
