import { WebSocket } from "ws";

export const MAX_PLAYERS_PER_ROOM = 4;

export class Room {
  constructor(id, roomType) {
    this.id = id;
    this.roomType = roomType;
    this.players = new Map();
    this.state = "waiting";
  }

  addPlayer(client) {
    this.players.set(client.id, client);
    client.roomId = this.id;
    console.log(`Added player to room: ${this.id}`);

    if (this.players.size >= MAX_PLAYERS_PER_ROOM) {
      this.state = "full";
    }
  }

  removePlayer(clientId) {
    this.players.delete(clientId);
    this.state = "waiting";
    console.log(`Removed player from room: ${this.id}`);

    if (this.players.size === 0) {
      return true;
    }
    return false;
  }

  broadcast(message, excludeId = null) {
    this.players.forEach((client) => {
      if (client.id !== excludeId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }
  
  broadcastToAll(message) {
    this.players.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  getPlayerList() {
    return Array.from(this.players.values()).map((client) => ({
      id: client.id,
      position: client.position,
      identity: client.identity,
    }));
  }
}
