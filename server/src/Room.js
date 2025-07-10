import { WebSocket } from "ws";
import { pack } from "./encoding.js";
import { msgDiscord } from "../discord.js";

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
    // message should have room id, client id, room type
    const msg = {
      roomId: this.id,
      clientId: client.id,
    };
    console.log(msg);
    msgDiscord(msg, {
      title: `Player joined ${this.roomType}`,
      color: 0x57f287,
    });

    if (this.players.size >= MAX_PLAYERS_PER_ROOM) {
      this.state = "full";
    }
  }

  removePlayer(clientId) {
    this.players.delete(clientId);
    this.state = "waiting";
    const msg = {
      roomId: this.id,
      clientId: clientId,
    };
    console.log(msg);
    msgDiscord(msg, {
      title: `Player left ${this.roomType}`,
      color: 0xed4245,
    });

    if (this.players.size === 0) {
      return true;
    }
    return false;
  }

  broadcast(message, excludeId = null) {
    this.players.forEach((client) => {
      if (client.id !== excludeId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(pack(message));
      }
    });
  }

  broadcastToAll(message) {
    this.players.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(pack(message));
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
