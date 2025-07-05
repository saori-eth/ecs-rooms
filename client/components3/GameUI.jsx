import React, { useEffect, useState } from 'react';
import MobileControls from './MobileControls';
import Chat from './Chat';
import './GameUI.css';

function GameUI({ roomInfo, gameManager, onExit }) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 767px)').matches || 
                  'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const handleMobileMove = (moveVector) => {
    if (gameManager && gameManager.mobileInputCallback) {
      gameManager.mobileInputCallback(moveVector);
    }
  };
  
  return (
    <>
      <div className="info">{isMobile ? 'Use joystick to move' : 'Use WASD to move'}</div>
      <div className="room-info">
        <div>Room: <span>{roomInfo.roomId || '-'}</span></div>
        <div>Players: <span>{roomInfo.playerCount}</span>/{roomInfo.maxPlayers}</div>
        <button className="exit-button" onClick={onExit}>Exit</button>
      </div>
      {isMobile && <MobileControls onMove={handleMobileMove} />}
      <Chat gameManager={gameManager} />
    </>
  );
}

export default GameUI;