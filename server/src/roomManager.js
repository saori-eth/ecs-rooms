import { Room, MAX_PLAYERS_PER_ROOM } from "./Room.js";

const rooms = new Map();
let nextRoomId = 1;

export function findOrCreateRoom(roomType) {
  for (const [roomId, room] of rooms) {
    if (room.state === "waiting" && room.roomType === roomType) {
      return room;
    }
  }

  const newRoom = new Room(`room-${nextRoomId++}`, roomType);
  rooms.set(newRoom.id, newRoom);
  return newRoom;
}

export function getRoom(roomId) {
  return rooms.get(roomId);
}

export function deleteRoom(roomId) {
  rooms.delete(roomId);
  console.log(`Room ${roomId} deleted (empty)`);
}

export function getRooms() {
  return rooms;
}
