import React, { useRef, useEffect, useState } from "react";
import "./MobileControls.css";
import GlobalEventManager from "../src/GlobalEventManager.js";

function MobileControls({ onMove, onJump }) {
  const joystickRef = useRef(null);
  const knobRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [touchId, setTouchId] = useState(null);

  useEffect(() => {
    const joystick = joystickRef.current;
    const knob = knobRef.current;
    if (!joystick || !knob) return;

    const joystickRect = joystick.getBoundingClientRect();
    const joystickRadius = joystickRect.width / 2;
    const maxDistance = joystickRadius - 20; // Leave some padding

    const handleStart = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Use changedTouches to get the new touch that just started
      const touch = e.changedTouches ? e.changedTouches[0] : e;
      setIsDragging(true);
      if (e.changedTouches) {
        setTouchId(touch.identifier);
      }
    };

    const handleMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const touch = e.touches
        ? Array.from(e.touches).find((t) => t.identifier === touchId)
        : e;

      if (!touch) return;

      const rect = joystick.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let deltaX = touch.clientX - centerX;
      let deltaY = touch.clientY - centerY;

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > maxDistance) {
        const angle = Math.atan2(deltaY, deltaX);
        deltaX = Math.cos(angle) * maxDistance;
        deltaY = Math.sin(angle) * maxDistance;
      }

      // Update knob position
      knob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

      // Calculate normalized movement vector
      const moveX = deltaX / maxDistance;
      const moveY = deltaY / maxDistance;

      // Check if we're in the sprint zone (outer 25% = distance > 75% of max)
      const normalizedDistance = distance / maxDistance;
      const isSprinting = normalizedDistance > 0.75;

      // Add sprint visual feedback
      if (isSprinting) {
        knob.classList.add("sprinting");
      } else {
        knob.classList.remove("sprinting");
      }

      const deadzone = 0.2;
      let discreteX = 0;
      let discreteZ = 0;

      if (normalizedDistance > deadzone) {
        const angle = Math.atan2(moveY, moveX) * (180 / Math.PI);
        let dirAngle = angle >= 0 ? angle : angle + 360;

        if (dirAngle >= 337.5 || dirAngle < 22.5) {
          discreteX = 1;
          discreteZ = 0; // right
        } else if (dirAngle < 67.5) {
          discreteX = 1;
          discreteZ = 1; // back-right
        } else if (dirAngle < 112.5) {
          discreteX = 0;
          discreteZ = 1; // back
        } else if (dirAngle < 157.5) {
          discreteX = -1;
          discreteZ = 1; // back-left
        } else if (dirAngle < 202.5) {
          discreteX = -1;
          discreteZ = 0; // left
        } else if (dirAngle < 247.5) {
          discreteX = -1;
          discreteZ = -1; // forward-left
        } else if (dirAngle < 292.5) {
          discreteX = 0;
          discreteZ = -1; // forward
        } else {
          discreteX = 1;
          discreteZ = -1; // forward-right
        }
      }

      // Use discreteX, discreteZ in onMove
      onMove({ x: discreteX, z: discreteZ, sprint: isSprinting });
    };

    const handleEnd = (e) => {
      if (!isDragging) return;

      // Check if our specific touch ended
      if (e.changedTouches) {
        const endedTouch = Array.from(e.changedTouches).find(
          (t) => t.identifier === touchId
        );
        if (!endedTouch) {
          // Our touch didn't end, ignore this event
          return;
        }
      }

      e.preventDefault();

      setIsDragging(false);
      setTouchId(null);

      // Reset knob position
      knob.style.transform = "translate(0, 0)";
      knob.classList.remove("sprinting");

      // Stop movement and sprint
      onMove({ x: 0, z: 0, sprint: false });
    };

    // Touch events
    GlobalEventManager.add(joystick, "touchstart", handleStart, {
      passive: false,
    });
    GlobalEventManager.add(document, "touchmove", handleMove, {
      passive: false,
    });
    GlobalEventManager.add(document, "touchend", handleEnd, { passive: false });
    GlobalEventManager.add(document, "touchcancel", handleEnd, {
      passive: false,
    });

    // Mouse events for testing on desktop
    GlobalEventManager.add(joystick, "mousedown", handleStart);
    GlobalEventManager.add(document, "mousemove", handleMove);
    GlobalEventManager.add(document, "mouseup", handleEnd);

    return () => {
      GlobalEventManager.remove(joystick, "touchstart", handleStart);
      GlobalEventManager.remove(document, "touchmove", handleMove);
      GlobalEventManager.remove(document, "touchend", handleEnd);
      GlobalEventManager.remove(document, "touchcancel", handleEnd);

      GlobalEventManager.remove(joystick, "mousedown", handleStart);
      GlobalEventManager.remove(document, "mousemove", handleMove);
      GlobalEventManager.remove(document, "mouseup", handleEnd);
    };
  }, [isDragging, touchId, onMove]);

  return (
    <div className="mobile-controls">
      <div className="joystick-container">
        <div ref={joystickRef} className="joystick">
          <div ref={knobRef} className="joystick-knob"></div>
        </div>
      </div>
      <button
        className="jump-button"
        onTouchStart={(e) => {
          if (onJump) onJump();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 14l5-5 5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

export default MobileControls;
