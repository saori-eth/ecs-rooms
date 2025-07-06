import { ComponentTypes } from "../components.js";
import * as CANNON from "cannon-es";
import * as THREE from "three";

export function createMovementSystem() {
  // Create reusable objects to avoid allocation in update loop
  const tempQuaternion = new THREE.Quaternion();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const moveVector = new THREE.Vector3();
  const rotatedVector = new THREE.Vector3();
  const euler = new THREE.Euler();

  return {
    update(ecsAPI, deltaTime) {
      const entities = ecsAPI.getEntitiesWithComponents(
        ComponentTypes.PHYSICS_BODY,
        ComponentTypes.INPUT,
        ComponentTypes.PLAYER
      );

      entities.forEach((entityId) => {
        const physicsComponent = ecsAPI.getComponent(
          entityId,
          ComponentTypes.PHYSICS_BODY
        );
        const input = ecsAPI.getComponent(entityId, ComponentTypes.INPUT);
        const player = ecsAPI.getComponent(entityId, ComponentTypes.PLAYER);
        const vrmComponent = ecsAPI.getComponent(entityId, ComponentTypes.VRM);

        if (!player.isLocal || !physicsComponent.body) return;

        const moveSpeed = player.speed;
        const { x, z } = input.moveVector;
        
        // Get camera yaw from ecsAPI
        const cameraYaw = ecsAPI.cameraYaw || 0;
        
        // Create movement vector in camera space
        moveVector.set(x, 0, z);
        
        // Rotate movement vector by camera yaw to make it camera-relative
        euler.set(0, cameraYaw, 0);
        rotatedVector.copy(moveVector).applyEuler(euler);

        const currentVelocity = physicsComponent.body.velocity;
        physicsComponent.body.velocity.set(
          rotatedVector.x * moveSpeed,
          currentVelocity.y,
          rotatedVector.z * moveSpeed
        );

        // Rotate VRM to face movement direction (camera-relative)
        if (vrmComponent && vrmComponent.vrm && (rotatedVector.x !== 0 || rotatedVector.z !== 0)) {
          const angle = Math.atan2(rotatedVector.x, rotatedVector.z) + Math.PI;
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
