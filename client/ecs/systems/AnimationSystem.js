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
          const actionToPlay = isMoving
            ? anim.actions.walking
            : anim.actions.idle;

          if (actionToPlay !== anim.currentAction) {
            const lastAction = anim.currentAction;
            anim.currentAction = actionToPlay;

            lastAction.fadeOut(0.2);
            anim.currentAction.reset().fadeIn(0.2).play();
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
