import { Room, MAX_PLAYERS_PER_ROOM } from "./Room.js";
import { msgDiscord } from "../discord.js";

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
  const msg = {
    roomId: newRoom.id,
    roomType: newRoom.roomType,
  };
  console.log(msg);
  try {
    msgDiscord(msg, { title: "Created new room", color: 0x57f287 });
  } catch (error) {
    console.error("Error sending created new room message to Discord:", error);
  }
  return newRoom;
}

export function getRoom(roomId) {
  return rooms.get(roomId);
}

export function deleteRoom(roomId) {
  rooms.delete(roomId);
  const msg = {
    roomId: roomId,
    roomType: "deleted",
  };
  console.log(msg);
  try {
    msgDiscord(msg, { title: "Deleted room", color: 0xed4245 });
  } catch (error) {
    console.error("Error sending deleted room message to Discord:", error);
  }
}

export function getRooms() {
  return rooms;
}
