import type { Request, Response } from "express";
import { type PackID, type Pack, type PackMember} from "../types/Pack.js";
import { type UserInfo } from "../types/User.js";
import { packHelpers } from "../db/packHelpers.js"
import { packsErrors } from "../error_messages/packs.js";
import { getRandomCampusSchedule, printCampusScheduleGrid } from "../mocks/schedules.js";
import { packValidation } from "./validation/packs.js";



export const getPackData = async(req: Request, res: Response): Promise<Response>=>{
    try{
        const owner_id : number = Number(req.session.userId);
        const pack_id : number = Number(req.params.pack_id);

        if(!packValidation.isValidUserId(owner_id)){
            return packsErrors.invalidOwnerIdResponse(res) as Response;
        }
        if(!packValidation.isValidPackId(pack_id)){
            return packsErrors.invalidPackIdResponse(res) as Response;
        }

        const pack = await packHelpers.getPackById(pack_id);

        if(!pack)
            return packsErrors.packNotFoundResponse(res) as Response;     

        if(pack.owner_id != owner_id){
            return packsErrors.invalidOwnerResponse(res) as Response;
        }

        const owner_info : UserInfo = await packHelpers.getPackOwnersInfo(owner_id);
        const pack_members_info : UserInfo[] = await packHelpers.getPackMembersUserInfo(pack_id);
        
        owner_info.campus_schedule = getRandomCampusSchedule();
        for(const member of pack_members_info){
            member.campus_schedule = getRandomCampusSchedule();
        } 
        
        const pack_data = [owner_info, ...pack_members_info];

        return res.status(200).json({pack_data});
        
    }catch(error){
        if(error instanceof Error)
            console.error(error.message);
        else
            console.error("Unknown error");
        return packsErrors.failedGetPackDataResponse(res);
    }

}

export const getPacks = async(req: Request, res: Response): Promise<Response>=>{
    const owner_id : number = Number(req.session.userId);
    if(!packValidation.isValidUserId(owner_id)){
        return packsErrors.invalidOwnerIdResponse(res) as Response;
    }
    return packHelpers.getPacks(owner_id)
            .then((packs : Pack[])=>{
                console.log("Succesfully retrieved packs.");
                return res.status(201).json({packs});
                
            }).catch((error : unknown)=>{
                if(error instanceof Error)
                    console.error(error.message);
                else
                    console.error("Unknown error");
                return packsErrors.failedGetPacksResponse(res);
            })
}


export const createPack = async(req: Request, res: Response): Promise<Response>=>{
        const new_pack = req.body.new_pack as Pack;
        const owner_id : number = Number(req.session.userId);
        new_pack.owner_id = owner_id;

        if(!packValidation.validateCreatePackInput(new_pack)){
            return packsErrors.invalidPackCreationInputResponse(res);
        }

        const friends : number[] = req.body.friends;

        packValidation.areValidUserIds(friends);

        if(!new_pack){
            return res.status(400).json({
                error:{
                    code: "NEW_PACK_REQUIRED",
                    message: "new_pack is required."
                }
        });
        }
        if(!Array.isArray(friends)){
            return res.status(400).json({
                error:{
                    code: "FRIENDS_REQUIRED",
                    message: "friends is required."
                }
            });
        }

        return packHelpers.createPack(new_pack, friends)
            .then((pack: Pack)=>{
                console.log("Succesfully created pack.");
                return res.status(201).json({pack});
                
            }).catch((error : unknown)=>{
                if(error instanceof Error)
                    console.error(error.message);
                else
                    console.error("Unknown error");
                return packsErrors.failedPackCreationResponse(res);
            })
}

export const deletePack = async(req: Request, res: Response): Promise<Response>=>{
    const owner_id : number = Number(req.session.userId);
    const pack_id = req.body.pack_id as PackID; 
   

    if(!packValidation.isValidPackId(pack_id)){
        return packsErrors.invalidPackIdResponse(res) as Response;
    }
    const pack = await packHelpers.getPackById(pack_id);

    if(!pack)
        return packsErrors.packNotFoundResponse(res) as Response;     

    if(pack.owner_id != owner_id){
        return packsErrors.invalidOwnerResponse(res) as Response;
    }

    
    return packHelpers.deletePack(pack_id)
        .then(()=>{
            console.log("Succesfully deleted pack.");
            return res.status(201).json({message: "Succesfully deleted pack."});

        }).catch((error: unknown)=>{
            if(error instanceof Error)
                console.error(error.message);
            else
                console.error("Unknown error");
            return packsErrors.failedPackDeletionResponse(res);
        })
}



export const getPackMembers = async(req: Request, res: Response): Promise<Response>=>{
    const owner_id : number = Number(req.session.userId);
    const pack_id : PackID = Number(req.params.pack_id);

    if(!packValidation.isValidPackId(pack_id)){
        return packsErrors.invalidPackIdResponse(res) as Response;
    }
    const pack = await packHelpers.getPackById(pack_id);

    if(!pack)
        return packsErrors.packNotFoundResponse(res) as Response;     

    if(pack.owner_id != owner_id){
        return packsErrors.invalidOwnerResponse(res) as Response;
    }

    
    return packHelpers.getPackMembers(pack_id)
        .then((members : PackMember[])=>{
            console.log("Succesfully retrieved pack members.");
            return res.status(201).json({members});

        }).catch((error: unknown)=>{
            if(error instanceof Error)
                console.error(error.message);
            else
                console.error("Unknown error");
            return packsErrors.failedGetPackMembersResponse(res);
        })
}

export const editPack = async(req: Request, res: Response): Promise<Response>=>{
    const edited_pack = req.body.edited_pack as Pack; 
    const pack_id = edited_pack.pack_id as PackID;
    const owner_id : number = Number(req.session.userId);
    if(!packValidation.isValidUserId(owner_id)){
        return packsErrors.invalidOwnerIdResponse(res) as Response;
    }
    if(!packValidation.isValidPackId(pack_id)){
        return packsErrors.invalidPackIdResponse(res) as Response;
    }

    const pack = await packHelpers.getPackById(pack_id);

    if(!pack)
        return packsErrors.packNotFoundResponse(res) as Response;     

    if(pack.owner_id != owner_id){
        return packsErrors.invalidOwnerResponse(res) as Response;
    }


    return packHelpers.editPack(edited_pack)
        .then((updated_pack : Pack)=>{
            console.log("Succesfully edited pack.");
            return res.status(201).json({updated_pack});

        }).catch((error: unknown)=>{
            if(error instanceof Error)
                console.error(error.message);
            else
                console.error("Unknown error");
            return packsErrors.failedEditPackResponse(res);
        })
}