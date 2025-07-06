import React, { useState, useEffect } from "react";
import { RoomCard } from "./RoomCard.jsx";
import "./RoomSelector.css";
import { rooms } from "../ecs/rooms/room-definitions.js";

export const RoomSelector = ({ selectedRoom, onRoomSelect }) => {
  const [roomData, setRoomData] = useState([]);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch("/api/rooms");
        const data = await response.json();
        setRoomData(data);
      } catch (error) {
        console.error("Failed to fetch room data:", error);
      }
    };

    fetchRoomData();
    const interval = setInterval(fetchRoomData, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Convert rooms object to array with IDs and merge with live player counts
  const roomList = Object.entries(rooms).map(([id, room]) => {
    const liveData = roomData.find((r) => r.id === id);
    return {
      id,
      ...room,
      playerCount: liveData ? liveData.playerCount : 0,
      description:
        room.name === "Arena Shooter"
          ? "Fast-paced combat with shooting mechanics"
          : "Open arena for exploration and practice",
    };
  });

  return (
    <div className="room-selector-container">
      <div className="room-selector-header">
        <h3>Select Game Mode</h3>
      </div>
      <div className="room-selector-scroll">
        <div className="room-selector-list">
          {roomList.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              isSelected={room.id === selectedRoom}
              onClick={onRoomSelect}
            />
          ))}
        </div>
      </div>
      <div className="room-selector-navigation">
        <button className="nav-button prev" aria-label="Previous room">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button className="nav-button next" aria-label="Next room">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18L15 12L9 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
