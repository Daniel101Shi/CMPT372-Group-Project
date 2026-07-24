import "dotenv/config";
import { pool } from "./db.js"

export async function testConnection(): Promise<void>{
    try{
        const result = await pool.query("SELECT current_database(), current_user, NOW()");
        console.log("Database connected successfully:");
        console.log(result.rows[0]);
    }catch(error){
        console.error("Database connection failed:", error);
        throw error;
    }
}

export async function shutdown(signal: string){
    console.log(`Received ${signal}. Shutting down...`);
    try{
        await pool.end();
        console.log("PostgreSQL connection pool closed");
        process.exit(0);
    }catch(error){
        console.error("Error while shutting down:", error);
        process.exit(1);
    }
}

