import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { handleConnection } from "./src/clientHandler.js";
import { startHeartbeat } from "./src/heartbeat.js";

// Determine __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8080;

// Express app to serve the built client
const app = express();
const distPath = path.join(__dirname, "..", "dist");

app.use(express.static(distPath));

// Fallback to index.html for SPA routing
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Create HTTP server and attach WebSocket server to it
const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", handleConnection);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Start game heartbeat loop
startHeartbeat();
