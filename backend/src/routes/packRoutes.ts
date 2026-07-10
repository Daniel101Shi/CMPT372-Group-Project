import { Router } from "express"
import { createPack } from "../controllers/packController.js";

const router = Router();

router.post("/packs/create", createPack);

export default router;