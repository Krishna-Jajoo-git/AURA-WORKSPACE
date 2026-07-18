import express from "express";
import dotenv from "dotenv";
import morgan from "morgan"; // usef for logging HTTP requests
import {connectPostgres } from "./config/db.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import cors from "cors";

dotenv.config();

connectPostgres();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser()); // Parse cookies from incoming requests
app.use(morgan("dev")); //http request logger middleware
app.use(cors({
    origin: "http://localhost:5173", // Allow requests from this origin
    credentials: true, // Allow cookies to be sent with requests
  }));

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.status(200);
  res.send("Aura Workspace Backend Core is running smoothly!");
});

app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
    console.log (`http://localhost:${PORT}`);
})
