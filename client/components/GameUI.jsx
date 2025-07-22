import React, { useEffect, useState } from "react";
import MobileControls from "./MobileControls";
import Chat from "./Chat";
import "./GameUI.css";
import GlobalEventManager from "../src/GlobalEventManager.js";

function GameUI({ roomInfo, ecsManager, onExit }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [showCameraReticle, setShowCameraReticle] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.matchMedia("(max-width: 767px)").matches ||
          "ontouchstart" in window
      );
    };

    checkMobile();
    GlobalEventManager.add(window, "resize", checkMobile);

    return () => GlobalEventManager.remove(window, "resize", checkMobile);
  }, []);

  // Check camera reticle preference
  useEffect(() => {
    const checkCameraReticle = () => {
      if (ecsManager) {
        setShowCameraReticle(ecsManager.shouldShowReticle());
      }
    };

    // Check immediately
    checkCameraReticle();

    // Check periodically in case camera changes
    const interval = setInterval(checkCameraReticle, 100);

    return () => clearInterval(interval);
  }, [ecsManager]);

  const handleMobileMove = (moveVector) => {
    if (ecsManager && ecsManager.mobileInputCallback) {
      ecsManager.mobileInputCallback(moveVector);
    }
  };

  const handleMobileJump = () => {
    if (ecsManager && ecsManager.mobileJumpCallback) {
      ecsManager.mobileJumpCallback();
    }
  };

  const handleCanvasClick = () => {
    if (!isMobile) {
      const canvas = document.querySelector("#canvas-container canvas");
      if (canvas && canvas.requestPointerLock) {
        canvas.requestPointerLock();
      }
    }
  };

  useEffect(() => {
    // Add click listener to the React root since it's above the canvas
    const reactRoot = document.getElementById("react-root");
    if (!isMobile && reactRoot) {
      GlobalEventManager.add(reactRoot, "click", handleCanvasClick);

      // Listen for pointer lock changes
      const handlePointerLockChange = () => {
        setIsPointerLocked(!!document.pointerLockElement);
      };

      GlobalEventManager.add(
        document,
        "pointerlockchange",
        handlePointerLockChange
      );

      return () => {
        GlobalEventManager.remove(reactRoot, "click", handleCanvasClick);
        GlobalEventManager.remove(
          document,
          "pointerlockchange",
          handlePointerLockChange
        );
      };
    }
  }, [isMobile]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      <div className="info">
        {isMobile
          ? "Joystick: move • Touch: rotate camera"
          : isPointerLocked
          ? "ESC to release mouse. WASD to move, mouse to look"
          : "Click to capture mouse. Use WASD to move, mouse to look"}
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
        <button 
          className="reload-button" 
          onClick={async () => {
            console.log('[GameUI] Reload Script button clicked');
            if (ecsManager && ecsManager.reloadSceneScript) {
              console.log('[GameUI] Calling ecsManager.reloadSceneScript()');
              await ecsManager.reloadSceneScript();
              console.log('[GameUI] Script reload complete');
            } else {
              console.log('[GameUI] ecsManager or reloadSceneScript not available');
            }
          }}
        >
          Reload Script
        </button>
      </div>
      {isMobile && (
        <MobileControls onMove={handleMobileMove} onJump={handleMobileJump} />
      )}
      {(isPointerLocked || isMobile) && showCameraReticle && (
        <div className="reticle">
          <div className="reticle-rect reticle-up"></div>
          <div className="reticle-rect reticle-down"></div>
          <div className="reticle-rect reticle-left"></div>
          <div className="reticle-rect reticle-right"></div>
        </div>
      )}
      <Chat ecsManager={ecsManager} />
    </div>
  );
}

export default GameUI;
