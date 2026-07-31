import { app } from "./app.js";
import { testConnection, shutdown } from "./db/testDB.js";

const port = Number(process.env.PORT ?? 3001);

async function startServer(){
  try{
    await testConnection();
    console.log("Connected to PostgreSQL")
    app.listen(port, "0.0.0.0", () => {
      console.log(`Backend listening on port ${port}`);
    });
  }catch(error){
    console.error("Failed to connect to PostgreSQL:", error);
    process.exit(1);
  }
}

startServer();
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
