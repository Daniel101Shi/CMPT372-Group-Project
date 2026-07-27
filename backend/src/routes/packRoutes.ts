import { Router } from "express"
import { getPacks, createPack, deletePack, editPack, getPackData, getPackMembers} from "../controllers/packController.js";

const router = Router();

router.get("/packs/get-pack-data/:owner_id/:pack_id", getPackData);
router.get("/packs/get-packs/:owner_id", getPacks);
router.get("/packs/get-pack-members/:pack_id", getPacks);
router.post("/packs/create-pack", createPack);
router.delete("/packs/delete-pack", deletePack);
router.patch("/packs/edit-pack", editPack);


export default router;