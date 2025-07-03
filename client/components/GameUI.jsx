import React from 'react';
import './GameUI.css';

function GameUI({ roomInfo }) {
  return (
    <>
      <div className="info">Use WASD to move</div>
      <div className="room-info">
        <div>Room: <span>{roomInfo.roomId || '-'}</span></div>
        <div>Players: <span>{roomInfo.playerCount}</span>/{roomInfo.maxPlayers}</div>
      </div>
    </>
  );
}

export default GameUI;