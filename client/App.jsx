import React, { useState, useEffect } from "react";
import MainMenu from "./components/MainMenu";
import GameUI from "./components/GameUI";
import LoadingScreen from "./components/LoadingScreen";
import { useGameState } from "./hooks/useGameState";
import "./App.css";

function App({ gameManager }) {
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

  const [playerIdentity, setPlayerIdentity] = useState(() => {
    const saved = localStorage.getItem("playerIdentity");
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      name: "",
      avatarId: "wassie",
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  });

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
    const updatedIdentity = { ...playerIdentity, name, avatarId };
    setPlayerIdentity(updatedIdentity);
    localStorage.setItem("playerIdentity", JSON.stringify(updatedIdentity));

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
        />
      )}
      {gameState === "loading" && <LoadingScreen />}
      {gameState === "playing" && (
        <GameUI roomInfo={roomInfo} gameManager={gameManager} onExit={handleExit} />
      )}
    </div>
  );
}

export default App;
