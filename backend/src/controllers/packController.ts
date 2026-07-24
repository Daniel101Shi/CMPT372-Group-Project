import type { Request, Response } from "express";
import { type PackID, type Pack, type PackMember} from "../types/Pack.js";
import { type UserInfo } from "../types/User.js";
import { packHelpers } from "../db/packHelpers.js"
import { getRandomCampusSchedule } from "../mocks/schedules.js";

export const getPackData = async(req: Request, res: Response): Promise<Response>=>{
    try{
        const owner_id : number = Number(req.params.owner_id);
        const owner_info : UserInfo = await packHelpers.getPackOwnersInfo(owner_id);
        const pack_id : number = Number(req.params.pack_id);
        const pack_members_info : UserInfo[] = await packHelpers.getPackMembersUserInfo(pack_id);
        
        owner_info.campus_schedule = getRandomCampusSchedule();
        for(const member of pack_members_info){
            member.campus_schedule = getRandomCampusSchedule();
        } 
        
        const pack_data = [owner_info, ...pack_members_info];

        return res.status(201).json({pack_data});
        
    }catch(error){
        if(error instanceof Error)
            console.error(error.message);
        else
            console.error("Unknown error");
        return res.status(500).json({message: "Failed to get pack data."})
    }

}

export const getPacks = async(req: Request, res: Response): Promise<Response>=>{
    const owner_id = Number(req.params.owner_id);
    return packHelpers.getPacks(owner_id)
            .then((packs : Pack[])=>{
                console.log("Succesfully retrieved packs.");
                return res.status(201).json({packs});
                
            }).catch((error : unknown)=>{
                if(error instanceof Error)
                    console.error(error.message);
                else
                    console.error("Unknown error");
                return res.status(500).json({message: "Failed to retrieve packs."});
            })
}


export const createPack = async(req: Request, res: Response): Promise<Response>=>{
        const new_pack = req.body.new_pack as Pack;
        const friends : number[] = req.body.friends;
        if(!new_pack){
            return res.status(400).json({
                message: "new_pack is required."
            });
        }
        if(!Array.isArray(friends)){
            return res.status(400).json({
                message: "friends is required."
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
                return res.status(500).json({message: "Failed to create pack."});
            })
}

export const deletePack = async(req: Request, res: Response): Promise<Response>=>{
    const pack_id = req.body.pack_id as PackID; 
    return packHelpers.deletePack(pack_id)
        .then(()=>{
            console.log("Succesfully deleted pack.");
            return res.status(201).json({message: "Succesfully deleted pack."});

        }).catch((error: unknown)=>{
            if(error instanceof Error)
                console.error(error.message);
            else
                console.error("Unknown error");
            return res.status(500).json({ message: "Failed to delete pack"})
        })
            
}

export const addPackMember = async(req: Request, res: Response): Promise<Response>=>{
    const user_id = req.body.user_id as number;
    const pack_id = req.body.user_id as PackID;
    return packHelpers.addPackMember(user_id, pack_id)
        .then((newPackMember : PackMember)=>{
            console.log("Succesfully added pack member.");
            return res.status(201).json({newPackMember});

        }).catch((error: unknown)=>{
            if(error instanceof Error)
                console.error(error.message);
            else
                console.error("Unknown error");
            return res.status(500).json({ message: "Failed to add pack member"})
        })
}

export const deletePackMember = async(req: Request, res: Response): Promise<Response>=>{
    const user_id = req.body.user_id as number;
    const pack_id = req.body.user_id as PackID;
    return packHelpers.deletePackMember(user_id, pack_id)
        .then(()=>{
            console.log("Succesfully deleted pack member.");
            return res.status(201).json({message: "Succesfully deleted pack member."});

        }).catch((error: unknown)=>{
            if(error instanceof Error)
                console.error(error.message);
            else
                console.error("Unknown error");
            return res.status(500).json({ message: "Failed to delete pack member"})
        })
}