import React from "react";
import { RoomCard } from "./RoomCard.jsx";
import "./RoomSelector.css";

const rooms = {
  "default-arena": {
    name: "Default Arena",
    description: "A default arena for testing",
  },
  "test-room": {
    name: "Test Room",
    description: "A test room for testing",
  },
};

export const RoomSelector = ({ selectedRoom, onRoomSelect }) => {
  // Convert rooms object to array with IDs
  const roomList = Object.entries(rooms).map(([id, room]) => ({
    id,
    ...room,
    description:
      room.name === "Arena Shooter"
        ? "Fast-paced combat with shooting mechanics"
        : "Open arena for exploration and practice",
  }));

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
