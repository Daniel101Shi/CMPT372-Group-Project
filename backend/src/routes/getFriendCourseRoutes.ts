import express from "express";

import { getFriendsCourses } from "../controllers/getFriendCourseController.js";

const router = express.Router();

router.get("/getfriendscourse/:term", getFriendsCourses);

export default router;