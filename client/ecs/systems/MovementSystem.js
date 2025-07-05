import { ComponentTypes } from "../components.js";
import * as CANNON from "cannon-es";
import * as THREE from "three";

export function createMovementSystem() {
  // Create reusable objects to avoid allocation in update loop
  const tempQuaternion = new THREE.Quaternion();
  const yAxis = new THREE.Vector3(0, 1, 0);

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
        const vrmComponent = world.getComponent(entityId, ComponentTypes.VRM);

        if (!player.isLocal || !physicsComponent.body) return;

        const moveSpeed = player.speed;
        const { x, z } = input.moveVector;

        const currentVelocity = physicsComponent.body.velocity;
        physicsComponent.body.velocity.set(
          x * moveSpeed,
          currentVelocity.y,
          z * moveSpeed
        );

        // Rotate VRM to face movement direction
        if (vrmComponent && vrmComponent.vrm && (x !== 0 || z !== 0)) {
          const angle = Math.atan2(x, z) + Math.PI;
          // Use reusable quaternion instead of creating new one
          tempQuaternion.setFromAxisAngle(yAxis, angle);
          vrmComponent.vrm.scene.quaternion.slerp(tempQuaternion, 0.15);
        }

        physicsComponent.body.velocity.y = Math.max(
          -10,
          physicsComponent.body.velocity.y
        );
      });
    },
  };
}
