import { findOrCreateRoom, getRoom, deleteRoom } from "./roomManager.js";
import { MAX_PLAYERS_PER_ROOM } from "./Room.js";

let nextClientId = 1;

function handleJoinGame(client, room) {
  room.addPlayer(client);

  client.ws.send(
    JSON.stringify({
      type: "joinedRoom",
      roomId: room.id,
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
          client.identity = message.identity || { name: `Player${client.id}`, avatarId: 'BitcoinGuy' };
          const room = findOrCreateRoom();
          handleJoinGame(client, room);
          break;

        case "move":
          handleMove(client, message);
          break;

        case "heartbeat":
          handleHeartbeat(client);
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
