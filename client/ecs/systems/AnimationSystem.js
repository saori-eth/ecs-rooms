import { ComponentTypes } from "../components.js";

export function createAnimationSystem() {
  return {
    update(world, deltaTime) {
      const entities = world.getEntitiesWithComponents(
        ComponentTypes.ANIMATION,
        ComponentTypes.INPUT,
        ComponentTypes.PLAYER
      );

      entities.forEach((entityId) => {
        const anim = world.getComponent(entityId, ComponentTypes.ANIMATION);
        const input = world.getComponent(entityId, ComponentTypes.INPUT);
        const player = world.getComponent(entityId, ComponentTypes.PLAYER);

        if (player.isLocal) {
          const isMoving = input.moveVector.x !== 0 || input.moveVector.z !== 0;
          const actionToPlay = isMoving ? anim.actions.walking : anim.actions.idle;

          if (actionToPlay !== anim.currentAction) {
            const lastAction = anim.currentAction;
            anim.currentAction = actionToPlay;

            lastAction.fadeOut(0.2);
            anim.currentAction.reset().fadeIn(0.2).play();
          }
        }

        anim.mixer.update(deltaTime);
      });
    },
  };
}