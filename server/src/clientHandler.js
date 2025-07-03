import { findOrCreateRoom, getRoom, deleteRoom } from "./roomManager.js";
import { MAX_PLAYERS_PER_ROOM } from "./Room.js";

let nextClientId = 1;

function handleJoinGame(client, room) {
  room.addPlayer(client);

  client.ws.send(
    JSON.stringify({
      type: "joinedRoom",
      roomId: room.id,
      roomType: room.roomType,
      playerId: client.id,
      players: room.getPlayerList().filter((p) => p.id !== client.id),
      maxPlayers: MAX_PLAYERS_PER_ROOM,
    })
  );

  room.broadcast(
    {
      type: "playerJoined",
      player: {
        id: client.id,
        position: client.position,
        identity: client.identity,
      },
    },
    client.id
  );

  room.broadcast({
    type: "roomUpdate",
    playerCount: room.players.size,
    maxPlayers: MAX_PLAYERS_PER_ROOM,
  });

  client.ws.send(
    JSON.stringify({
      type: "roomUpdate",
      playerCount: room.players.size,
      maxPlayers: MAX_PLAYERS_PER_ROOM,
    })
  );

  console.log(
    `Client ${client.id} joined ${room.id} (${room.players.size}/${MAX_PLAYERS_PER_ROOM})`
  );
}

function handleMove(client, message) {
  if (client.roomId) {
    client.position = message.position;
    const room = getRoom(client.roomId);

    if (room) {
      room.broadcast(
        {
          type: "playerMoved",
          id: client.id,
          position: message.position,
          rotation: message.rotation,
          isMoving: message.isMoving,
          timestamp: Date.now(),
        },
        client.id
      );
    }
  }
}

function handleHeartbeat(client) {
  client.lastHeartbeat = Date.now();
  client.ws.send(JSON.stringify({ type: "heartbeatAck" }));
}

function handleChatMessage(client, message) {
  if (client.roomId) {
    const room = getRoom(client.roomId);
    if (room) {
      const chatMessage = {
        type: "chatMessage",
        author: client.identity?.name || `Player${client.id}`,
        text: message.text.substring(0, 200), // Limit message length
        timestamp: Date.now()
      };
      
      // Send to all players in the room including the sender
      room.broadcastToAll(chatMessage);
    }
  }
}

function handleGameEvent(client, message) {
  if (client.roomId) {
    const room = getRoom(client.roomId);
    if (room) {
      // Forward game events to all players in the room
      const gameEvent = {
        type: "gameEvent",
        eventType: message.eventType,
        data: message.data,
        playerId: client.id,
        timestamp: Date.now()
      };
      
      // Broadcast to all players including the sender for consistency
      room.broadcastToAll(gameEvent);
    }
  }
}

export function handleConnection(ws) {
  const clientId = nextClientId++;
  const client = {
    id: clientId,
    ws: ws,
    position: { x: 0, y: 1.5, z: 0 },
    roomId: null,
    lastHeartbeat: Date.now(),
    identity: null,
  };

  console.log(`Client ${clientId} connected`);

  ws.send(
    JSON.stringify({
      type: "connected",
      id: clientId,
    })
  );

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case "joinGame":
          client.identity = message.identity || {
            name: `Player${client.id}`,
            avatarId: "low-poly-girl",
          };
          const roomType = message.roomType || "default-arena";
          const room = findOrCreateRoom(roomType);
          handleJoinGame(client, room);
          break;

        case "move":
          handleMove(client, message);
          break;

        case "heartbeat":
          handleHeartbeat(client);
          break;
          
        case "chatMessage":
          handleChatMessage(client, message);
          break;
          
        case "gameEvent":
          handleGameEvent(client, message);
          break;
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    console.log(`Client ${client.id} disconnected`);

    if (client.roomId) {
      const room = getRoom(client.roomId);
      if (room) {
        const shouldDeleteRoom = room.removePlayer(client.id);

        if (shouldDeleteRoom) {
          deleteRoom(room.id);
        } else {
          room.broadcast({
            type: "playerLeft",
            id: client.id,
          });

          room.broadcast({
            type: "roomUpdate",
            playerCount: room.players.size,
            maxPlayers: MAX_PLAYERS_PER_ROOM,
          });
        }
      }
    }
  });

  ws.on("error", (error) => {
    console.error(`Client ${client.id} error:`, error);
  });
}
