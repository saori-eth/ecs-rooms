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

  const inputState = {
    keys: {},
    mobileMove: { x: 0, z: 0 },
    isMobile: false,
    mouseDelta: { x: 0, y: 0 },
    wheelDelta: 0,
  };

  const moveVector = { x: 0, y: 0, z: 0 };

  // Mobile input handler
  const handleMobileInput = (moveVector) => {
    inputState.mobileMove = moveVector;
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

      // Store inputState reference on ecsAPI for access by other systems
      ecsAPI.inputState = inputState;
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
