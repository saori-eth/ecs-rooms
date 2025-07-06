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
          
          let actionToPlay;
          
          // Determine which animation to play
          if (!isGrounded) {
            actionToPlay = anim.actions.jump;
          } else if (isMoving) {
            actionToPlay = anim.actions.walking;
          } else {
            actionToPlay = anim.actions.idle;
          }

          // Handle animation transitions
          if (actionToPlay !== anim.currentAction) {
            const lastAction = anim.currentAction;
            anim.currentAction = actionToPlay;

            // Special handling for jump animation
            if (actionToPlay === anim.actions.jump) {
              lastAction.fadeOut(0.1);
              anim.currentAction.reset().fadeIn(0.1).play();
            } else {
              lastAction.fadeOut(0.2);
              anim.currentAction.reset().fadeIn(0.2).play();
            }
          }
          
          // If jump animation finished and player is grounded, transition back
          if (anim.currentAction === anim.actions.jump && 
              !anim.actions.jump.isRunning() && 
              isGrounded) {
            const nextAction = isMoving ? anim.actions.walking : anim.actions.idle;
            anim.currentAction = nextAction;
            anim.actions.jump.stop();
            nextAction.reset().fadeIn(0.2).play();
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
