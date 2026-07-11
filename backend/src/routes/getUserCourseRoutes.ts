import express from "express";

import { getUserCourses } from "../controllers/getUserCourseController.js";

const router = express.Router();

router.get("/getcourse/:userId", getUserCourses);

export default router;



// put this afterfriendshipRoutes in backend/src/index.ts to enable the getUserCourses route
// app.use("/api", getUserCourseRoutes);