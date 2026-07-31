import express from "express";

import { deleteUser, listUsers, updateUserRole } from "../controllers/adminController.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { requireRole } from "./middleware/requireRole.js";

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/users", listUsers);
router.patch("/users/:userId/role", updateUserRole);
router.delete("/users/:userId", deleteUser);

export default router;
