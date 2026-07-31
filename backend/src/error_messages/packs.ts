import type { Response } from "express";

const packsErrors = {

    invalidOwnerIdResponse: (res: Response) : Response => {
        return res.status(400).json({
            error:{
                code: "INVALID_OWNER_ID",
                message: "owner_id should be a positive integer."
            }
        });
    },
    invalidPackIdResponse: (res: Response) : Response => {
        return res.status(400).json({
            error:{
                code: "INVALID_PACK_ID",
                message: "pack_id should be a positive integer."
            }
        });
    },

    // you can only put your own friends in a pack. without this you could name any user_id
    // and read back their contact info and schedule, which the profile endpoint hides.
    notFriendsResponse: (res: Response) : Response => {
        return res.status(403).json({
            error:{
                code: "NOT_FRIENDS",
                message: "You can only add your friends to a pack."
            }
        });
    },

    packNotFoundResponse: (res: Response) : Response => {
        return res.status(404).json({
            error:{
                code: "PACK_NOT_FOUND",
                message: "No pack was found with the provided pack_id."
            }
        });
    },

    invalidOwnerResponse: (res: Response) : Response => {
        return res.status(400).json({
            error:{
                code: "INVALID_OWNERSHIP",
                message: "This user doesn't own the requested pack."
            }
        });
    },

    invalidPackCreationInputResponse: (res: Response) : Response => {
        return res.status(400).json({
            error:{
                code: "INVALID_PACK_CREATION_INPUT",
                message: "The input provided for creating a pack was invalid."
            }
        });
    },

    failedPackDeletionResponse: (res: Response) : Response => {
        return res.status(500).json({
            error:{
                code: "FAILED_PACK_DELETION",
                message: "Failed to delete pack."
            }
        });
    },
    failedPackCreationResponse: (res: Response) : Response => {
        return res.status(500).json({
            error:{
                code: "FAILED_PACK_CREATION",
                message: "Failed to create pack."
            }
        });
    },
    failedGetPackDataResponse: (res: Response) : Response => {
        return res.status(500).json({
            error:{
                code: "FAILED_GET_PACK_DATA",
                message: "Failed to fetch pack data."
            }
        });
    },
    failedGetPacksResponse: (res: Response) : Response => {
        return res.status(500).json({
            error:{
                code: "FAILED_GET_PACKS",
                message: "Failed to fetch packs."
            }
        });
    },
    failedGetPackMembersResponse: (res: Response) : Response => {
        return res.status(500).json({
            error:{
                code: "FAILED_GET_PACK_MEMBERS",
                message: "Failed to fetch pack members."
            }
        });
    },
    failedEditPackResponse: (res: Response) : Response => {
        return res.status(500).json({
            error:{
                code: "PACK_EDI_EDIT",
                message: "Failed to edit pack."
            }
        });
    },
}

export {packsErrors};