import React, { useState, useEffect } from "react";
import MainMenu from "./components/MainMenu";
import LoadingScreen from "./components/LoadingScreen";
import { useGameState } from "./hooks/useGameState";
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
    const saved = localStorage.getItem("playerIdentity");
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      name: "",
      avatarId: "cryptovoxels",
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  });

  return (
    <div className="app">
      {gameState === "menu" && (
        <MainMenu
          playerIdentity={playerIdentity}
          connectionStatus={connectionStatus}
          playEnabled={playEnabled}
        />
      )}
      {gameState === "loading" && <LoadingScreen />}
    </div>
  );
}

export default App;
