import express from "express";

import { getUserCourse } from "../controllers/getUserCourseController.js";

const router = express.Router();

router.get("/getcourse/:term", getUserCourse);

export default router;



// put this afterfriendshipRoutes in backend/src/index.ts to enable the getUserCourse route
// app.use("/api", getUserCourseRoutes);