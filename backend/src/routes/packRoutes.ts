import { Router } from "express"
import { getPacks, createPack, deletePack, editPack, getPackData, getPackMembers} from "../controllers/packController.js";
import { requireAuth } from "./middleware/requireAuth.js";

const router = Router();

router.get("/packs/get-pack-data/:owner_id/:pack_id", requireAuth, getPackData);
router.get("/packs/get-packs/:owner_id", requireAuth, getPacks);
router.get("/packs/get-pack-members/:pack_id", requireAuth, getPacks);
router.post("/packs/create-pack", requireAuth, createPack);
router.delete("/packs/delete-pack", requireAuth, deletePack);
router.patch("/packs/edit-pack", requireAuth, editPack);


export default router;