import { pool } from "../db/db.js"
import { type QueryResult, type PoolClient} from "pg";
import { type PackID, type Pack, type PackMember, type Friend} from "../types/Pack.js";
import { type UserInfo } from "../types/User.js";
import { addPackMember } from "../controllers/packController.js";

const addFriendsToPack = async(client : PoolClient, pack_id: number, friends: number[])=>{

    const q = 
    `
    INSERT INTO pack_members (pack_id, user_id)
    VALUES ($1, $2)
    `;
    
    for(const id of friends)
        await client.query(q, [pack_id, id]);
}

const packHelpers = {

    getPacks: async(owner_id : number) : Promise<Pack[]> =>{
        const getPacksQuery =
        `
        SELECT * FROM packs
        WHERE owner_id = $1;
        `;
        const client = (await pool.connect()) as PoolClient;
        try{
            await client.query("BEGIN");
            const result = (await client.query(
                getPacksQuery, [owner_id]
            )) as QueryResult;
            
            await client.query("COMMIT");
            return result.rows as Pack[];

        }catch(error){
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }

    },

    createPack: async(pack : Pack, friends: number[]) : Promise<Pack> =>{
        
        const packCreationQuery = 
        `
        INSERT INTO packs (owner_id, group_name, semester, year)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
        `;
        const client = (await pool.connect()) as PoolClient;
        try{
            await client.query("BEGIN");
            const result = (await client.query(packCreationQuery, [
                pack.owner_id,
                pack.group_name,
                pack.semester,
                pack.year
            ])) as QueryResult;

            const new_pack : Pack = result.rows[0];

            await addFriendsToPack(client, new_pack.pack_id, friends);

            await client.query("COMMIT");

            return new_pack;

        }catch(error){
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    },

    deletePack: async(pack_id : PackID) : Promise<void> =>{
        const packDeletionQuery = `DELETE FROM packs WHERE pack_id = $1;`;
        const client = (await pool.connect()) as PoolClient;
        try{
            await client.query("BEGIN");
            await client.query(packDeletionQuery, [pack_id]);
            await client.query("COMMIT");
        }catch(error){
            await client.query("ROLLBACK");
            throw error;
        } finally{
            client.release();
        }
    },

    addPackMember: async(user_id: number, pack_id: PackID) : Promise<PackMember>=>{
        const addPackMemberQuery = 
        `
        INSERT INTO pack_members (user_id, pack_id)
        VALUES ($1, $2)
        RETURNING
        pack_id,
        user_id;
        `;
        const client = (await pool.connect()) as PoolClient;
        try{
            await client.query("BEGIN");
            const result = (await client.query(
                addPackMemberQuery, [user_id, pack_id]
            )) as QueryResult;
            await client.query("COMMIT");
            return (result.rows[0]) as PackMember;
            
        }catch(error){
            await client.query("ROLLBACK");
            throw error;
        } finally{
            client.release();
        }
    },

    deletePackMember: async(user_id: number, pack_id: PackID) : Promise<void>=>{
        const deletePackMemberQuery = 
        `
        DELETE FROM pack_members 
        WHERE user_id = $1 AND pack_id = $2;
        `;
        const client = (await pool.connect()) as PoolClient;
        try{
            await client.query("BEGIN");
            await client.query(deletePackMemberQuery, [user_id, pack_id]);
            await client.query("COMMIT");
        }catch(error){
            await client.query("ROLLBACK");
            throw error;
        } finally{
            client.release();
        }
    },

    getPackMembersUserInfo:  async(pack_id: PackID) : Promise<UserInfo[]>=>{
        const getQuery = 
        `
        SELECT pack_members.user_id, users.username, users.contact_info, users.campus_schedule, users.created_at 
        FROM pack_members 
        INNER JOIN users 
            ON users.user_id = pack_members.user_id
        WHERE pack_id = $1;
        `;
        const client = (await pool.connect()) as PoolClient;
        try{
            await client.query("BEGIN");
            const result = await client.query(getQuery, [pack_id]) as QueryResult;
            await client.query("COMMIT");
            return (result.rows) as UserInfo[];
        }catch(error){
            await client.query("ROLLBACK");
            throw error;
        } finally{
            client.release();
        }
    },

    getPackOwnersInfo:  async(owner_id: number) : Promise<UserInfo>=>{
        const getQuery = 
        `
        SELECT user_id, username, contact_info, campus_schedule, created_at 
        FROM users
        WHERE user_id = $1;
        `;
        const client = (await pool.connect()) as PoolClient;
        try{
            await client.query("BEGIN");
            const result = await client.query(getQuery, [owner_id]) as QueryResult;
            await client.query("COMMIT");
            return (result.rows[0]) as UserInfo;
        }catch(error){
            await client.query("ROLLBACK");
            throw error;
        } finally{
            client.release();
        }
    }
    
};

export { packHelpers };

