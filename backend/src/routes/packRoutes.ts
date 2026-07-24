import { Router } from "express"
import { getPacks, createPack, deletePack, addPackMember, deletePackMember, getPackData} from "../controllers/packController.js";

const router = Router();

router.get("/packs/get-pack-data/:owner_id/:pack_id", getPackData);
router.get("/packs/get-packs/:owner_id", getPacks);
router.post("/packs/create-pack", createPack);
router.delete("/packs/delete-pack", deletePack);
router.patch("/packs/add-member", addPackMember);
router.patch("/packs/delete-member", deletePackMember);

export default router;