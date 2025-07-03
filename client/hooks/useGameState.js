import { useState } from 'react';

export function useGameState() {
  const [gameState, setGameState] = useState('menu');
  const [connectionStatus, setConnectionStatus] = useState('Connecting to server...');
  const [playEnabled, setPlayEnabled] = useState(false);
  const [roomInfo, setRoomInfo] = useState({
    roomId: null,
    playerCount: 0,
    maxPlayers: 4
  });

  const updateRoomInfo = (roomId, playerCount, maxPlayers) => {
    setRoomInfo({ roomId, playerCount, maxPlayers });
  };

  return {
    gameState,
    connectionStatus,
    playEnabled,
    roomInfo,
    setGameState,
    setConnectionStatus,
    setPlayEnabled,
    updateRoomInfo
  };
}