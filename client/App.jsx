import React, { useState, useEffect, useMemo } from "react";
import MainMenu from "./components/MainMenu";
import GameUI from "./components/GameUI";
import LoadingScreen from "./components/LoadingScreen";
import { useGameState } from "./hooks/useGameState";
import { ECSManager } from "./ecs/ECSManager";
import { availableAvatars } from "./src/VRMLoader";
import { IdentityManager } from "./src/IdentityManager";
import "./App.css";

function App() {
  const [gameManager] = useState(() => new ECSManager());
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

  const identityManager = useMemo(
    () => new IdentityManager(availableAvatars),
    []
  );

  const [playerIdentity, setPlayerIdentity] = useState(
    identityManager.getIdentity()
  );

  // Pass state setters to game manager
  useEffect(() => {
    if (gameManager) {
      gameManager.setStateCallbacks({
        setGameState,
        setConnectionStatus,
        setPlayEnabled,
        updateRoomInfo,
        getPlayerIdentity: () => playerIdentity,
      });
    }
  }, [gameManager, playerIdentity]);

  const handlePlay = async (name, avatarId, roomType) => {
    identityManager.saveIdentity(name, avatarId);
    const updatedIdentity = identityManager.getIdentity();
    setPlayerIdentity(updatedIdentity);

    // Set game state to loading immediately
    setGameState("loading");

    // Initialize game if not already done
    if (!isInitialized) {
      const container = document.getElementById("canvas-container");
      await gameManager.initialize(container);
      setIsInitialized(true);
    }

    if (gameManager && gameManager.onPlay) {
      gameManager.onPlay(updatedIdentity, roomType);
    }
  };

  const handleExit = () => {
    if (gameManager) {
      gameManager.reset();
    }
    setIsInitialized(false);
    setGameState("menu");
  };

  return (
    <div className="app">
      {gameState === "menu" && (
        <MainMenu
          playerIdentity={playerIdentity}
          connectionStatus={connectionStatus}
          playEnabled={playEnabled}
          onPlay={handlePlay}
          identityManager={identityManager}
        />
      )}
      {gameState === "loading" && <LoadingScreen />}
      {gameState === "playing" && (
        <GameUI
          roomInfo={roomInfo}
          gameManager={gameManager}
          onExit={handleExit}
        />
      )}
    </div>
  );
}

export default App;
