import express from "express";
import dotenv from "dotenv";
import morgan from "morgan"; // usef for logging HTTP requests
import {connectPostgres } from "./config/db.js";

dotenv.config();

connectPostgres();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(morgan("dev")); //http request logger middleware

app.get("/", (req, res) => {
  res.status(200);
  res.send("Aura Workspace Backend Core is running smoothly!");
});

app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
    console.log (`http://localhost:${PORT}`);
})
