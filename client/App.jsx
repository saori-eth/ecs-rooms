import React, { useState, useEffect } from "react";
import MainMenu from "./components/MainMenu";
import LoadingScreen from "./components/LoadingScreen";
import { useGameState } from "./hooks/useGameState";
import { IdentityManager } from "./src/IdentityManager";
import { VRMManager } from "./src/VRMLoader";
import "./App.css";

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const {
    gameState,
    connectionStatus,
    playEnabled,
    roomInfo,
    setGameState,
    setConnectionStatus,
    setPlayEnabled,
    updateRoomInfo,
  } = useGameState();

  useEffect(() => {
    console.log("Game state changed:", gameState);
  }, [gameState]);

  const [playerIdentity, setPlayerIdentity] = useState(() => {
    // Create VRMManager instance to get available avatars
    const vrmManager = new VRMManager();
    const availableAvatars = vrmManager.getAvailableAvatars();
    
    // Create IdentityManager with available avatars for validation
    const identityManager = new IdentityManager(availableAvatars);
    const identity = identityManager.getIdentity();
    
    // Add a unique ID if not present
    if (!identity.id) {
      identity.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    return identity;
  });

  return (
    <div className="app">
      {gameState === "menu" && (
        <MainMenu
          playerIdentity={playerIdentity}
          connectionStatus={connectionStatus}
          playEnabled={playEnabled}
          onIdentityUpdate={setPlayerIdentity}
        />
      )}
      {gameState === "loading" && <LoadingScreen />}
    </div>
  );
}

export default App;
