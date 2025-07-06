import React, { useEffect, useState } from "react";
import MobileControls from "./MobileControls";
import Chat from "./Chat";
import "./GameUI.css";

function GameUI({ roomInfo, gameManager, onExit }) {
  console.log("GameUI rendered");
  const [isMobile, setIsMobile] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.matchMedia("(max-width: 767px)").matches ||
          "ontouchstart" in window
      );
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMobileMove = (moveVector) => {
    if (gameManager && gameManager.mobileInputCallback) {
      gameManager.mobileInputCallback(moveVector);
    }
  };

  const handleMobileJump = () => {
    if (gameManager && gameManager.mobileJumpCallback) {
      gameManager.mobileJumpCallback();
    }
  };

  const handleCanvasClick = () => {
    if (!isMobile) {
      const canvas = document.querySelector('#canvas-container canvas');
      if (canvas && canvas.requestPointerLock) {
        canvas.requestPointerLock();
      }
    }
  };

  useEffect(() => {
    // Add click listener to the React root since it's above the canvas
    const reactRoot = document.getElementById('react-root');
    if (!isMobile && reactRoot) {
      reactRoot.addEventListener('click', handleCanvasClick);
      
      // Listen for pointer lock changes
      const handlePointerLockChange = () => {
        setIsPointerLocked(!!document.pointerLockElement);
      };
      
      document.addEventListener('pointerlockchange', handlePointerLockChange);
      
      return () => {
        reactRoot.removeEventListener('click', handleCanvasClick);
        document.removeEventListener('pointerlockchange', handlePointerLockChange);
      };
    }
  }, [isMobile]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <div className="info">
        {isMobile ? "Joystick: move • Touch: rotate camera • Pinch: zoom" : isPointerLocked ? "ESC to release mouse. WASD to move, mouse to look" : "Click to capture mouse. Use WASD to move, mouse to look"}
      </div>
      <div className="room-info">
        <div>
          Room: <span>{roomInfo.roomId || "-"}</span>
        </div>
        <div>
          Players: <span>{roomInfo.playerCount}</span>/{roomInfo.maxPlayers}
        </div>
        <button className="exit-button" onClick={onExit}>
          Exit
        </button>
      </div>
      {isMobile && <MobileControls onMove={handleMobileMove} onJump={handleMobileJump} />}
      <Chat gameManager={gameManager} />
    </div>
  );
}

export default GameUI;
