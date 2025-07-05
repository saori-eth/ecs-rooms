import React, { useRef, useEffect, useState } from 'react';
import './MobileControls.css';

function MobileControls({ onMove }) {
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
      const touch = e.touches ? e.touches[0] : e;
      setIsDragging(true);
      if (e.touches) {
        setTouchId(touch.identifier);
      }
    };
    
    const handleMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const touch = e.touches ? 
        Array.from(e.touches).find(t => t.identifier === touchId) || e.touches[0] : 
        e;
      
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
      
      // Convert to game coordinates
      // Joystick up (negative Y) should move forward (negative Z)
      // Joystick down (positive Y) should move backward (positive Z)
      onMove({ x: moveX, z: moveY });
    };
    
    const handleEnd = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      
      setIsDragging(false);
      setTouchId(null);
      
      // Reset knob position
      knob.style.transform = 'translate(0, 0)';
      
      // Stop movement
      onMove({ x: 0, z: 0 });
    };
    
    // Touch events
    joystick.addEventListener('touchstart', handleStart, { passive: false });
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd, { passive: false });
    document.addEventListener('touchcancel', handleEnd, { passive: false });
    
    // Mouse events for testing on desktop
    joystick.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    
    return () => {
      joystick.removeEventListener('touchstart', handleStart);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('touchcancel', handleEnd);
      
      joystick.removeEventListener('mousedown', handleStart);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
    };
  }, [isDragging, touchId, onMove]);
  
  return (
    <div className="mobile-controls">
      <div className="joystick-container">
        <div ref={joystickRef} className="joystick">
          <div ref={knobRef} className="joystick-knob"></div>
        </div>
      </div>
    </div>
  );
}

export default MobileControls;