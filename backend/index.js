import express from "express";
import dotenv from "dotenv";
import morgan from "morgan"; // used for logging HTTP requests
import { connectPostgres } from "./config/db.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import cors from "cors";
import vaultRoutes from "./routes/vaultRoutes.js";
import http from "http";
import { initSocket } from "./utils/socket.js";

dotenv.config();

connectPostgres();

const app = express();

// 1. Create native HTTP server wrapping Express
const server = http.createServer(app);

// 2. Attach Socket.io to this HTTP server instance
initSocket(server);

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:5173", // Allow requests from this origin
  credentials: true,               // Allow cookies to be sent with requests
}));

app.use(express.json());
app.use(cookieParser()); // Parse cookies from incoming requests
app.use(morgan("dev"));  // HTTP request logger middleware

app.use("/api/users", userRoutes);
app.use("/api/vault", vaultRoutes);

app.get("/", (req, res) => {
  res.status(200).send("Aura Workspace Backend Core is running smoothly!");
});

// 3. MUST LISTEN ON server, NOT app
server.listen(PORT, () => {
  console.log(`🚀 Server with WebSockets is running on port ${PORT}`);
  console.log(`📡 http://localhost:${PORT}`);
});