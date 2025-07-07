import React, { useState, useEffect, useRef } from "react";
import "./MainMenu.css";
import { MenuScene } from "../src/MenuScene.js";
import { MenuTabs } from "./MenuTabs.jsx";
import { Inventory } from "./Inventory.jsx";
import { RoomSelector } from "./RoomSelector.jsx";
import { rooms } from "../ecs/rooms/room-definitions.js";

// Set to true to enable maintenance mode
const maintenanceMode = true;

function MainMenu({
  playerIdentity,
  connectionStatus,
  playEnabled,
  onPlay,
  onIdentityUpdate,
  identityManager,
}) {
  const [name, setName] = useState(playerIdentity.name);
  const [avatarId, setAvatarId] = useState(playerIdentity.avatarId);
  const [roomType, setRoomType] = useState(
    Object.keys(rooms)[0] || "default-arena"
  );
  const [activeTab, setActiveTab] = useState("game");
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);

  const canvasRef = useRef(null);
  const menuSceneRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize the 3D menu scene
    const menuScene = new MenuScene(canvasRef.current);
    menuSceneRef.current = menuScene;
    menuScene.init();

    // Set up loading callback
    menuScene.onAvatarLoaded = () => {
      setIsAvatarLoading(false);
    };

    // Load the initial avatar
    setIsAvatarLoading(true);
    menuScene.loadAvatar(avatarId);

    // Cleanup on unmount
    return () => {
      if (menuSceneRef.current) {
        menuSceneRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    // Update avatar position based on active tab
    if (menuSceneRef.current) {
      menuSceneRef.current.setAvatarPosition(
        activeTab === "lobby" ? "center" : "left"
      );
    }
  }, [activeTab]);

  // Sync name state with playerIdentity changes
  useEffect(() => {
    setName(playerIdentity.name || "");
  }, [playerIdentity.name]);

  const handlePlay = () => {
    const playerName =
      name.trim() || `Player${Math.floor(Math.random() * 1000)}`;
    if (onPlay) {
      onPlay(playerName, avatarId, roomType);
    }
  };

  const handleNameChange = (newName) => {
    setName(newName);
    identityManager.saveIdentity(newName, avatarId);

    // Notify parent component if callback is provided
    if (onIdentityUpdate) {
      onIdentityUpdate(identityManager.getIdentity());
    }
  };

  const handleAvatarSelect = (newAvatarId) => {
    setAvatarId(newAvatarId);
    identityManager.saveIdentity(name, newAvatarId);

    // Notify parent component if callback is provided
    if (onIdentityUpdate) {
      onIdentityUpdate(identityManager.getIdentity());
    }

    if (menuSceneRef.current) {
      setIsAvatarLoading(true);
      menuSceneRef.current.switchAvatar(newAvatarId);
    }
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="main-menu">
      <canvas ref={canvasRef} className="menu-canvas" />

      <MenuTabs activeTab={activeTab} onTabClick={handleTabClick} />

      <div className="player-name-wrapper">
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Enter your name"
          maxLength={20}
          className="player-name-input"
        />
      </div>

      <img src="/images/logo.png" alt="LobbyWS" className="logo" />

      {activeTab === "game" && (
        <>
          <div className="player-info-container">
            <button
              className="play-button"
              disabled={!playEnabled || maintenanceMode}
              onClick={handlePlay}
            >
              <span className="play-button-text">
                {maintenanceMode ? "MAINTENANCE" : "PLAY"}
              </span>
              {!maintenanceMode && (
                <svg
                  className="play-button-icon"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path d="M5 3L19 12L5 21V3Z" fill="currentColor" />
                </svg>
              )}
            </button>
          </div>

          <RoomSelector selectedRoom={roomType} onRoomSelect={setRoomType} />
        </>
      )}

      {activeTab === "inventory" && (
        <Inventory
          currentAvatarId={avatarId}
          onAvatarSelect={handleAvatarSelect}
          vrmManager={menuSceneRef.current.vrmManager}
        />
      )}

      <div className="connection-status">{connectionStatus}</div>
    </div>
  );
}

export default MainMenu;
