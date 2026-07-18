import { Router } from "express"
import { getPacks, createPack, deletePack, addPackMember, deletePackMember} from "../controllers/packController.js";

const router = Router();

router.get("/packs/get-packs", getPacks);
router.post("/packs/create-pack", createPack);
router.delete("/packs/delete-pack", deletePack);
router.patch("/packs/add-member", addPackMember);
router.patch("/packs/delete-member", deletePackMember);

export default router;