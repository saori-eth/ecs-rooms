import React, { useState, useEffect, useRef } from 'react';
import MainMenu from './components/MainMenu';
import GameUI from './components/GameUI';
import { useGameState } from './hooks/useGameState';
import './App.css';

function App({ gameManager }) {
  const {
    gameState,
    connectionStatus,
    playEnabled,
    roomInfo,
    setGameState,
    setConnectionStatus,
    setPlayEnabled,
    updateRoomInfo
  } = useGameState();

  const [playerIdentity, setPlayerIdentity] = useState(() => {
    const saved = localStorage.getItem('playerIdentity');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      name: '',
      avatarId: 'low-poly-girl',
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
        getPlayerIdentity: () => playerIdentity
      });
    }
  }, [gameManager, playerIdentity]);

  const handlePlay = (name, avatarId) => {
    const updatedIdentity = { ...playerIdentity, name, avatarId };
    setPlayerIdentity(updatedIdentity);
    localStorage.setItem('playerIdentity', JSON.stringify(updatedIdentity));
    
    if (gameManager && gameManager.onPlay) {
      gameManager.onPlay(updatedIdentity);
    }
  };

  return (
    <div className="app">
      {gameState === 'menu' && (
        <MainMenu
          playerIdentity={playerIdentity}
          connectionStatus={connectionStatus}
          playEnabled={playEnabled}
          onPlay={handlePlay}
        />
      )}
      {gameState === 'playing' && (
        <GameUI roomInfo={roomInfo} gameManager={gameManager} />
      )}
    </div>
  );
}

export default App;