import { WebSocketServer } from "ws";
import { handleConnection } from "./src/clientHandler.js";
import { startHeartbeat } from "./src/heartbeat.js";

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server listening on port ${PORT}`);

wss.on("connection", handleConnection);

startHeartbeat();
