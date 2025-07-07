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
  let cameraTouchId = null;

  const handleTouchStart = (e) => {
    // Find a touch that's not on the joystick area
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      
      // Check if this touch is on the joystick area
      if (target && target.closest('.mobile-controls')) {
        continue;
      }
      
      // This touch is not on joystick, use it for camera
      if (!cameraTouchId) {
        cameraTouchId = touch.identifier;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
        break;
      }
    }
  };

  const handleTouchMove = (e) => {
    // Find the camera touch if we have one
    if (cameraTouchId !== null) {
      const cameraTouch = Array.from(e.touches).find(t => t.identifier === cameraTouchId);
      
      if (cameraTouch) {
        // Single touch - rotate camera
        const deltaX = cameraTouch.clientX - lastTouchX;
        const deltaY = cameraTouch.clientY - lastTouchY;
        
        inputState.touchDelta.x += deltaX;
        inputState.touchDelta.y += deltaY;
        
        lastTouchX = cameraTouch.clientX;
        lastTouchY = cameraTouch.clientY;
      }
    }
  };

  const handleTouchEnd = (e) => {
    // Check if the camera touch ended
    if (cameraTouchId !== null) {
      const remainingTouch = Array.from(e.touches).find(t => t.identifier === cameraTouchId);
      if (!remainingTouch) {
        // Camera touch has ended
        cameraTouchId = null;
      }
    }
  };

  const inputState = {
    keys: {},
    mobileMove: { x: 0, z: 0 },
    isMobile: false,
    mouseDelta: { x: 0, y: 0 },
    wheelDelta: 0,
    touchDelta: { x: 0, y: 0 },
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
