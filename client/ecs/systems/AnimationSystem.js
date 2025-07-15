import { ComponentTypes } from "../components.js";

export function createAnimationSystem() {
  return {
    onLocalPlayerIdleAnimation: null,
    notifiedIdle: false,

    update(ecsAPI, deltaTime) {
      const entities = ecsAPI.getEntitiesWithComponents(
        ComponentTypes.ANIMATION,
        ComponentTypes.INPUT,
        ComponentTypes.PLAYER
      );

      entities.forEach((entityId) => {
        const anim = ecsAPI.getComponent(entityId, ComponentTypes.ANIMATION);
        const input = ecsAPI.getComponent(entityId, ComponentTypes.INPUT);
        const player = ecsAPI.getComponent(entityId, ComponentTypes.PLAYER);

        if (player.isLocal) {
          const isMoving = input.moveVector.x !== 0 || input.moveVector.z !== 0;
          const isGrounded = player.isGrounded !== false; // Default to true if undefined
          const isSprinting = ecsAPI.inputState && ecsAPI.inputState.sprint;

          let actionToPlay;

          // Determine which animation to play
          if (!isGrounded) {
            actionToPlay = anim.actions.jump;
          } else if (isMoving) {
            // Determine movement direction relative to camera
            const moveX = input.moveVector.x;
            const moveZ = input.moveVector.z;
            const absMoveX = Math.abs(moveX);
            const absMoveZ = Math.abs(moveZ);

            // Threshold to determine if movement is primarily straight or diagonal
            const diagonalThreshold = 0.4;

            let direction = "forward";

            if (absMoveZ > absMoveX) {
              // Primarily forward or backward
              direction = moveZ > 0 ? "backwards" : "forward";
              if (absMoveX > diagonalThreshold) {
                direction += moveX > 0 ? "_right" : "_left";
              }
            } else {
              // Primarily left or right
              const horizontalDir = moveX > 0 ? "right" : "left";
              if (absMoveZ > diagonalThreshold) {
                const verticalDir = moveZ > 0 ? "backwards" : "forward";
                direction = verticalDir + "_" + horizontalDir;
              } else {
                direction = horizontalDir;
              }
            }

            // Choose animation based on direction and sprint state
            if (direction === "forward") {
              actionToPlay = isSprinting
                ? anim.actions.sprint
                : anim.actions.walking;
            } else if (direction === "backwards") {
              actionToPlay = isSprinting
                ? anim.actions.backwards_sprint || anim.actions.sprint
                : anim.actions.backwards_walk || anim.actions.walking;
            } else if (direction === "left") {
              actionToPlay = isSprinting
                ? anim.actions.left_sprint || anim.actions.sprint
                : anim.actions.left_walk || anim.actions.walking;
            } else if (direction === "right") {
              actionToPlay = isSprinting
                ? anim.actions.right_sprint || anim.actions.sprint
                : anim.actions.right_walk || anim.actions.walking;
            } else if (direction === "forward_left") {
              actionToPlay = isSprinting
                ? anim.actions.left_strafe_sprint || anim.actions.sprint
                : anim.actions.left_strafe_walk || anim.actions.walking;
            } else if (direction === "forward_right") {
              actionToPlay = isSprinting
                ? anim.actions.right_strafe_sprint || anim.actions.sprint
                : anim.actions.right_strafe_walk || anim.actions.walking;
            } else if (direction === "backwards_left") {
              actionToPlay = isSprinting
                ? anim.actions.backwards_left_strafe_sprint ||
                  anim.actions.backwards_sprint ||
                  anim.actions.sprint
                : anim.actions.backwards_left_strafe_walk ||
                  anim.actions.backwards_walk ||
                  anim.actions.walking;
            } else if (direction === "backwards_right") {
              actionToPlay = isSprinting
                ? anim.actions.backwards_right_strafe_sprint ||
                  anim.actions.backwards_sprint ||
                  anim.actions.sprint
                : anim.actions.backwards_right_strafe_walk ||
                  anim.actions.backwards_walk ||
                  anim.actions.walking;
            }
          } else {
            actionToPlay = anim.actions.idle;
          }

          // Handle animation transitions
          if (actionToPlay && actionToPlay !== anim.currentAction) {
            const lastAction = anim.currentAction;
            anim.currentAction = actionToPlay;

            // Special handling for jump animation
            if (actionToPlay === anim.actions.jump) {
              if (lastAction) lastAction.fadeOut(0.1);
              anim.currentAction.reset().fadeIn(0.1).play();
            } else {
              if (lastAction) lastAction.fadeOut(0.2);
              anim.currentAction.reset().fadeIn(0.2).play();
            }
          }

          // If jump animation finished and player is grounded, transition back
          if (
            anim.currentAction === anim.actions.jump &&
            !anim.actions.jump.isRunning() &&
            isGrounded
          ) {
            let nextAction;
            if (isMoving) {
              // Determine movement direction for landing transition
              const moveX = input.moveVector.x;
              const moveZ = input.moveVector.z;
              const absMoveX = Math.abs(moveX);
              const absMoveZ = Math.abs(moveZ);
              const diagonalThreshold = 0.4;

              let direction = "forward";
              if (absMoveZ > absMoveX) {
                direction = moveZ > 0 ? "backwards" : "forward";
                if (absMoveX > diagonalThreshold) {
                  direction += moveX > 0 ? "_right" : "_left";
                }
              } else {
                const horizontalDir = moveX > 0 ? "right" : "left";
                if (absMoveZ > diagonalThreshold) {
                  const verticalDir = moveZ > 0 ? "backwards" : "forward";
                  direction = verticalDir + "_" + horizontalDir;
                } else {
                  direction = horizontalDir;
                }
              }

              if (direction === "forward") {
                nextAction = isSprinting
                  ? anim.actions.sprint
                  : anim.actions.walking;
              } else if (direction === "backwards") {
                nextAction = isSprinting
                  ? anim.actions.backwards_sprint || anim.actions.sprint
                  : anim.actions.backwards_walk || anim.actions.walking;
              } else if (direction === "left") {
                nextAction = isSprinting
                  ? anim.actions.left_sprint || anim.actions.sprint
                  : anim.actions.left_walk || anim.actions.walking;
              } else if (direction === "right") {
                nextAction = isSprinting
                  ? anim.actions.right_sprint || anim.actions.sprint
                  : anim.actions.right_walk || anim.actions.walking;
              } else if (direction === "forward_left") {
                nextAction = isSprinting
                  ? anim.actions.left_strafe_sprint || anim.actions.sprint
                  : anim.actions.left_strafe_walk || anim.actions.walking;
              } else if (direction === "forward_right") {
                nextAction = isSprinting
                  ? anim.actions.right_strafe_sprint || anim.actions.sprint
                  : anim.actions.right_strafe_walk || anim.actions.walking;
              } else if (direction === "backwards_left") {
                nextAction = isSprinting
                  ? anim.actions.backwards_left_strafe_sprint ||
                    anim.actions.backwards_sprint ||
                    anim.actions.sprint
                  : anim.actions.backwards_left_strafe_walk ||
                    anim.actions.backwards_walk ||
                    anim.actions.walking;
              } else if (direction === "backwards_right") {
                nextAction = isSprinting
                  ? anim.actions.backwards_right_strafe_sprint ||
                    anim.actions.backwards_sprint ||
                    anim.actions.sprint
                  : anim.actions.backwards_right_strafe_walk ||
                    anim.actions.backwards_walk ||
                    anim.actions.walking;
              }
            } else {
              nextAction = anim.actions.idle;
            }
            if (nextAction) {
              anim.currentAction = nextAction;
              anim.actions.jump.stop();
              nextAction.reset().fadeIn(0.2).play();
            }
          }
        }

        anim.mixer.update(deltaTime);
      });

      // Check for local player with idle animation
      if (!this.notifiedIdle && this.onLocalPlayerIdleAnimation) {
        const localPlayerEntities = ecsAPI.getEntitiesWithComponents(
          ComponentTypes.ANIMATION,
          "localPlayer"
        );

        localPlayerEntities.forEach((entityId) => {
          const anim = ecsAPI.getComponent(entityId, ComponentTypes.ANIMATION);

          // Check if idle animation is playing
          if (
            anim.currentAction === anim.actions.idle &&
            anim.actions.idle.isRunning()
          ) {
            this.notifiedIdle = true;
            this.onLocalPlayerIdleAnimation();
          }
        });
      }
    },
  };
}
