import { pool } from "../db/db.js"
import { type QueryResult, type PoolClient} from "pg";
import { type PackID, type Pack, type PackMember } from "../types/Pack.js";

const addFriendsToPack = async(client : PoolClient, pack_id: number, friends: number[])=>{
    try{

        const q = 
        `
        INSERT INTO packs (pack_id, user_id)
        VALUES ($1, $2)
        `;
    
    for(const id of friends)
        await client.query(q, [
            pack_id, 
            id
        ]);
    }catch(error){
        if(error instanceof Error)
            console.error(error.message);
        else
            console.error("Unknown error");
    }
}

const packHelpers = {

    createPack: async(pack : Pack, friends: number[]) : Promise<PackID> =>{
        
        const packCreationQuery = 
        `
        INSERT INTO packs (owner_id, group_name, semester, year)
        VALUES ($1, $2, $3, $4)
        RETURNING
        pack_id
        `;
        const client = (await pool.connect()) as PoolClient;
        try{
            await client.query("BEGIN");
            const result = (await pool.query(packCreationQuery, [
                pack.owner_id,
                pack.group_name,
                pack.semester,
                pack.year
            ])) as QueryResult;

            const pack_id : number = result.rows[0].pack_id;

            await addFriendsToPack(client, pack_id, friends);

            await client.query("COMMIT");

            return pack_id;

        }catch(error){
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

};

export { packHelpers };

