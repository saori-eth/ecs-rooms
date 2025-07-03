import React, { useState } from "react";
import "./MainMenu.css";

function MainMenu({ playerIdentity, connectionStatus, playEnabled, onPlay }) {
  const [name, setName] = useState(playerIdentity.name);
  const [avatarId, setAvatarId] = useState(playerIdentity.avatarId);

  const handlePlay = () => {
    const playerName =
      name.trim() || `Player${Math.floor(Math.random() * 1000)}`;
    onPlay(playerName, avatarId);
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
