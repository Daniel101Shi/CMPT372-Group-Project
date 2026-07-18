import { Router } from "express"
import { createPack, deletePack, addPackMember, deletePackMember} from "../controllers/packController.js";

const router = Router();

router.post("/packs/create-pack", createPack);
router.post("/packs/delete-pack", deletePack);
router.post("/packs/add-member", addPackMember);
router.post("/packs/delete-member", deletePackMember);

export default router;