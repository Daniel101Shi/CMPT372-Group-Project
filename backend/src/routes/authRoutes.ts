import express from "express";
import { register, login, logout, getCurrentUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.get("/auth/me", getCurrentUser);

export default router;
