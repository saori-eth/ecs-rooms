import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { handleConnection } from "./src/clientHandler.js";
import { startHeartbeat } from "./src/heartbeat.js";
import { getRooms } from "./src/roomManager.js";
import { MAX_PLAYERS_PER_ROOM } from "./src/Room.js";

// Determine __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8080;

// Express app to serve the built client
const app = express();
const distPath = path.join(__dirname, "..", "dist");

// Enable CORS for development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.static(distPath));

// Health check endpoint for Fly.io
app.get("/health", (req, res) => {
  const rooms = getRooms();
  let totalPlayers = 0;
  let totalCapacity = 0;

  rooms.forEach((room) => {
    totalPlayers += room.players.size;
    totalCapacity += MAX_PLAYERS_PER_ROOM;
  });

  // Calculate server load percentage
  const loadPercentage =
    totalCapacity > 0 ? (totalPlayers / totalCapacity) * 100 : 0;

  res.json({
    status: "healthy",
    totalPlayers,
    totalCapacity,
    roomCount: rooms.size,
    loadPercentage,
    availableSlots: Math.max(0, totalCapacity - totalPlayers),
  });
});

// API endpoint for room information
app.get("/api/rooms", (req, res) => {
  const rooms = getRooms();
  const roomData = [];
  
  rooms.forEach((room, roomId) => {
    roomData.push({
      id: room.roomType,
      playerCount: room.players.size
    });
  });
  
  res.json(roomData);
});

// Metrics endpoint for autoscaling
app.get("/metrics", (req, res) => {
  const rooms = getRooms();
  let totalPlayers = 0;
  let fullRooms = 0;

  rooms.forEach((room) => {
    totalPlayers += room.players.size;
    if (room.players.size >= MAX_PLAYERS_PER_ROOM) {
      fullRooms++;
    }
  });

  // Prometheus-style metrics
  res.type("text/plain");
  res.send(`# HELP game_players_total Total number of connected players
# TYPE game_players_total gauge
game_players_total ${totalPlayers}

# HELP game_rooms_total Total number of active rooms
# TYPE game_rooms_total gauge
game_rooms_total ${rooms.size}

# HELP game_rooms_full Number of full rooms
# TYPE game_rooms_full gauge
game_rooms_full ${fullRooms}

# HELP game_server_load Server load percentage (0-100)
# TYPE game_server_load gauge
game_server_load ${rooms.size > 0 ? (fullRooms / rooms.size) * 100 : 0}
`);
});

// Fallback to index.html for SPA routing
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Create HTTP server and attach WebSocket server to it
const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", handleConnection);

server.listen(PORT, () => {});

// Start game heartbeat loop
startHeartbeat();
