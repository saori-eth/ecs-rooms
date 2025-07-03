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

  const inputState = {
    keys: {},
    mobileMove: { x: 0, z: 0 },
    isMobile: false
  };

  // Mobile input handler
  const handleMobileInput = (moveVector) => {
    inputState.mobileMove = moveVector;
  };

  return {
    init(world) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      
      // Check if mobile
      inputState.isMobile = window.matchMedia('(max-width: 767px)').matches || 
                           'ontouchstart' in window;
      
      // Store reference for mobile input callback
      this.handleMobileInput = handleMobileInput;
    },

    update(world, deltaTime) {
      const entities = world.getEntitiesWithComponents(
        ComponentTypes.INPUT,
        ComponentTypes.PLAYER
      );

      entities.forEach((entityId) => {
        const input = world.getComponent(entityId, ComponentTypes.INPUT);
        const player = world.getComponent(entityId, ComponentTypes.PLAYER);

        if (player.isLocal) {
          let moveVector = { x: 0, y: 0, z: 0 };
          
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
    }
  };
}