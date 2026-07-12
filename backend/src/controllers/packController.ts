import type { Request, Response } from "express";
import { type PackID, type Pack} from "../types/Pack.js";
import { packHelpers } from "../db/packHelpers.js"

export const createPack = async(req: Request, res: Response): Promise<Response>=>{
    try{
        const new_pack = req.body.new_pack as Pack;
        const friends : number[] = req.body.friends;
        if(!new_pack){
            return res.status(400).json({
                message: "new_pack is required"
            });
        }
        if(!Array.isArray(friends)){
            return res.status(400).json({
                message: "friends is required"
            });
        }
        const response : Response = await packHelpers.createPack(new_pack, friends)
            .then((pack_id: PackID)=>{
                console.log("Succesfully created pack.");
                return res.status(201).json({pack_id});
                
            }).catch((error : unknown)=>{
                if(error instanceof Error)
                    console.error(error.message);
                else
                    console.error("Unknown error");
                return res.status(500).json({message: "Failed to create pack."});
            })
        return response;
        
    }catch(error: unknown){
        if(error instanceof Error)
            console.error(error.message);
        else
            console.error("Unknown error:", error);
        return res.status(500).json({message: "Failed to create pack."});
    }
}