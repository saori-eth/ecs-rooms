import React, { useState } from "react";
import "./MainMenu.css";
import { rooms } from "../rooms/room-definitions.js";

function MainMenu({ playerIdentity, connectionStatus, playEnabled, onPlay }) {
  const [name, setName] = useState(playerIdentity.name);
  const [avatarId, setAvatarId] = useState(playerIdentity.avatarId);
  const [roomType, setRoomType] = useState(Object.keys(rooms)[0] || "default-arena");

  const handlePlay = () => {
    const playerName =
      name.trim() || `Player${Math.floor(Math.random() * 1000)}`;
    onPlay(playerName, avatarId, roomType);
  };

  return (
    <div className="main-menu">
      <img src="/images/logo.png" alt="Digispace" className="logo" />
      <div className="player-customization">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          maxLength={20}
          className="player-name-input"
        />
        <select
          value={avatarId}
          onChange={(e) => setAvatarId(e.target.value)}
          className="player-avatar-select"
        >
          <option value="low-poly-girl">Low Poly Girl</option>
          <option value="glasses">Glasses</option>
          <option value="bonnie">Bonnie</option>
          <option value="taiga">Taiga</option>
        </select>
        <select
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
          className="room-select"
        >
          {Object.entries(rooms).map(([key, room]) => (
            <option key={key} value={key}>
              {room.name}
            </option>
          ))}
        </select>
      </div>
      <button
        className="play-button"
        onClick={handlePlay}
        disabled={!playEnabled}
      >
        Play
      </button>
      <div className="connection-status">{connectionStatus}</div>
    </div>
  );
}

export default MainMenu;
