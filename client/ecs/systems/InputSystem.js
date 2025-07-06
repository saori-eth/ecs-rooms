import { ComponentTypes } from "../components.js";

export function createInputSystem() {
  const handleKeyDown = (e) => {
    const key = e.key.toLowerCase();
    inputState.keys[key] = true;
  };

  const handleKeyUp = (e) => {
    const key = e.key.toLowerCase();
    inputState.keys[key] = false;
  };

  const handleMouseMove = (e) => {
    if (document.pointerLockElement) {
      inputState.mouseDelta.x += e.movementX;
      inputState.mouseDelta.y += e.movementY;
    }
  };

  const handleWheel = (e) => {
    if (document.pointerLockElement) {
      e.preventDefault();
      inputState.wheelDelta += e.deltaY;
    }
  };

  const handlePointerLockChange = () => {
    if (document.pointerLockElement) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("wheel", handleWheel, { passive: false });
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("wheel", handleWheel);
    }
  };

  // Touch handling for camera control
  let touchStartX = 0;
  let touchStartY = 0;
  let lastTouchX = 0;
  let lastTouchY = 0;
  let initialPinchDistance = 0;
  let isCameraTouch = false;

  const handleTouchStart = (e) => {
    // Only handle camera touch if it's not on the joystick
    const touch = e.touches[0];
    const target = e.target;
    
    // Check if the touch is on the joystick area
    if (target.closest('.mobile-controls')) {
      return;
    }
    
    if (e.touches.length === 1) {
      isCameraTouch = true;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
    } else if (e.touches.length === 2) {
      // Handle pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e) => {
    if (!isCameraTouch && e.touches.length !== 2) return;
    
    if (e.touches.length === 1 && isCameraTouch) {
      // Single touch - rotate camera
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastTouchX;
      const deltaY = touch.clientY - lastTouchY;
      
      inputState.touchDelta.x += deltaX;
      inputState.touchDelta.y += deltaY;
      
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (initialPinchDistance > 0) {
        const delta = (initialPinchDistance - distance) * 2; // Scale factor
        inputState.pinchDelta += delta;
      }
      
      initialPinchDistance = distance;
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) {
      isCameraTouch = false;
      initialPinchDistance = 0;
    }
  };

  const inputState = {
    keys: {},
    mobileMove: { x: 0, z: 0 },
    isMobile: false,
    mouseDelta: { x: 0, y: 0 },
    wheelDelta: 0,
    touchDelta: { x: 0, y: 0 },
    pinchDelta: 0,
    jump: false,
    sprint: false,
  };

  const moveVector = { x: 0, y: 0, z: 0 };

  // Mobile input handler
  const handleMobileInput = (moveVector) => {
    inputState.mobileMove = moveVector;
    // Handle sprint from mobile controls
    if (moveVector.sprint !== undefined) {
      inputState.sprint = moveVector.sprint;
    }
  };

  // Mobile jump handler
  const handleMobileJump = () => {
    inputState.jump = true;
  };

  return {
    init(ecsAPI) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      document.addEventListener("pointerlockchange", handlePointerLockChange);

      // Check if mobile
      inputState.isMobile =
        window.matchMedia("(max-width: 767px)").matches ||
        "ontouchstart" in window;

      // Store reference for mobile input callback
      this.handleMobileInput = handleMobileInput;
      this.handleMobileJump = handleMobileJump;

      // Store inputState reference on ecsAPI for access by other systems
      ecsAPI.inputState = inputState;
      
      // Add touch event listeners for mobile camera control
      if (inputState.isMobile) {
        document.addEventListener("touchstart", handleTouchStart, { passive: false });
        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd, { passive: false });
      }
    },

    update(ecsAPI, deltaTime) {
      // Toggle stats with 'p' key
      if (inputState.keys.p && !this.p_pressed) {
        if (ecsAPI.toggleStats) {
          ecsAPI.toggleStats();
        }
        this.p_pressed = true;
      } else if (!inputState.keys.p) {
        this.p_pressed = false;
      }

      // Handle jump with spacebar
      if (inputState.keys[' '] && !this.space_pressed) {
        inputState.jump = true;
        this.space_pressed = true;
      } else if (!inputState.keys[' ']) {
        this.space_pressed = false;
      }

      // Handle sprint - preserve mobile sprint state if on mobile
      if (!inputState.isMobile) {
        inputState.sprint = inputState.keys['shift'] || false;
      }

      const entities = ecsAPI.getEntitiesWithComponents(
        ComponentTypes.INPUT,
        ComponentTypes.PLAYER
      );

      entities.forEach((entityId) => {
        const input = ecsAPI.getComponent(entityId, ComponentTypes.INPUT);
        const player = ecsAPI.getComponent(entityId, ComponentTypes.PLAYER);

        if (player.isLocal) {
          moveVector.x = 0;
          moveVector.y = 0;
          moveVector.z = 0;

          if (inputState.isMobile) {
            // Use mobile input
            moveVector.x = inputState.mobileMove.x;
            moveVector.z = inputState.mobileMove.z;
          } else {
            // Use keyboard input
            input.keys.w = inputState.keys.w || false;
            input.keys.a = inputState.keys.a || false;
            input.keys.s = inputState.keys.s || false;
            input.keys.d = inputState.keys.d || false;

            if (input.keys.w) moveVector.z -= 1;
            if (input.keys.s) moveVector.z += 1;
            if (input.keys.a) moveVector.x -= 1;
            if (input.keys.d) moveVector.x += 1;

            // Normalize diagonal movement
            if (moveVector.x !== 0 && moveVector.z !== 0) {
              const factor = 0.7071067811865475; // 1/Math.sqrt(2)
              moveVector.x *= factor;
              moveVector.z *= factor;
            }
          }

          input.moveVector.x = moveVector.x;
          input.moveVector.z = moveVector.z;
        }
      });
    },

    // Expose mobile input handler
    setMobileInputHandler(callback) {
      this.handleMobileInput = callback;
    },
  };
}
