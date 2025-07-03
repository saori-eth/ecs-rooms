import { getRooms } from "./roomManager.js";

const TIMEOUT = 30000;
const HEARTBEAT_INTERVAL = 5000;

export function startHeartbeat() {
  setInterval(() => {
    const now = Date.now();
    const rooms = getRooms();

    rooms.forEach((room) => {
      room.players.forEach((client, id) => {
        if (now - client.lastHeartbeat > TIMEOUT) {
          client.ws.close();
        }
      });
    });
  }, HEARTBEAT_INTERVAL);
}
