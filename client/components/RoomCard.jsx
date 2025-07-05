import React from "react";
import "./RoomCard.css";

export const RoomCard = ({ room, isSelected, onClick }) => {
  const getPlayerCount = () => {
    // This could be connected to real player count data later
    return Math.floor(Math.random() * 20);
  };

  return (
    <div
      className={`room-card ${isSelected ? "selected" : ""}`}
      onClick={() => onClick(room.id)}
    >
      <div className="room-card-image">
        <img
          src={`/rooms/thumbnails/${room.id}.jpg`}
          alt={room.name}
          onError={(e) => {
            e.target.src = "/images/placeholder-room.png";
          }}
        />
        <div className="room-card-overlay">
          <div className="room-card-players">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="9"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M23 21v-2a4 4 0 0 0-3-3.87"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 3.13a4 4 0 0 1 0 7.75"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{getPlayerCount()}</span>
          </div>
        </div>
      </div>
      <div className="room-card-info">
        <h3>{room.name}</h3>
        <p>{room.description || "Classic gameplay experience"}</p>
      </div>
      {isSelected && <div className="room-card-selected-badge">SELECTED</div>}
    </div>
  );
};
