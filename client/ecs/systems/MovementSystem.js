import { ComponentTypes } from "../components.js";
import * as CANNON from "cannon-es";

export function createMovementSystem() {
  return {
    update(world, deltaTime) {
      const entities = world.getEntitiesWithComponents(
        ComponentTypes.PHYSICS_BODY,
        ComponentTypes.INPUT,
        ComponentTypes.PLAYER
      );

      entities.forEach((entityId) => {
        const physicsComponent = world.getComponent(
          entityId,
          ComponentTypes.PHYSICS_BODY
        );
        const input = world.getComponent(entityId, ComponentTypes.INPUT);
        const player = world.getComponent(entityId, ComponentTypes.PLAYER);

        if (!player.isLocal || !physicsComponent.body) return;

        const moveSpeed = player.speed;
        const { x, z } = input.moveVector;

        const currentVelocity = physicsComponent.body.velocity;
        physicsComponent.body.velocity.set(
          x * moveSpeed,
          currentVelocity.y,
          z * moveSpeed
        );

        physicsComponent.body.velocity.y = Math.max(
          -10,
          physicsComponent.body.velocity.y
        );
      });
    },
  };
}
