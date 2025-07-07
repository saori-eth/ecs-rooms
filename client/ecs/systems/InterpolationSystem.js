import { ComponentTypes } from "../components.js";
import * as THREE from "three";

export function createInterpolationSystem() {
  // Create reusable objects to avoid allocation in update loop
  const tempQuaternion1 = new THREE.Quaternion();
  const tempQuaternion2 = new THREE.Quaternion();

  return {
    fixedUpdate(ecsAPI, fixedDeltaTime) {
      const entities = ecsAPI.getEntitiesWithComponents(
        ComponentTypes.POSITION,
        ComponentTypes.INTERPOLATION,
        ComponentTypes.PLAYER,
        ComponentTypes.PHYSICS_BODY
      );

      entities.forEach((entityId) => {
        const interpolation = ecsAPI.getComponent(
          entityId,
          ComponentTypes.INTERPOLATION
        );
        const player = ecsAPI.getComponent(entityId, ComponentTypes.PLAYER);
        const physicsComponent = ecsAPI.getComponent(
          entityId,
          ComponentTypes.PHYSICS_BODY
        );

        if (!player.isLocal && physicsComponent.body) {
          const now = Date.now();
          const renderDelay = 100;
          const renderTime = now - renderDelay;

          // Handle physics position updates
          if (interpolation.positionBuffer.length > 0) {
            if (
              interpolation.positionBuffer.length >= 2 &&
              interpolation.positionBuffer[0].timestamp <= renderTime &&
              renderTime <= interpolation.positionBuffer[1].timestamp
            ) {
              const t0 = interpolation.positionBuffer[0].timestamp;
              const t1 = interpolation.positionBuffer[1].timestamp;
              const p0 = interpolation.positionBuffer[0].position;
              const p1 = interpolation.positionBuffer[1].position;

              const alpha = (renderTime - t0) / (t1 - t0);

              const newX = p0.x + (p1.x - p0.x) * alpha;
              const newY = p0.y + (p1.y - p0.y) * alpha;
              const newZ = p0.z + (p1.z - p0.z) * alpha;

              physicsComponent.body.position.set(newX, newY, newZ);
            } else if (interpolation.positionBuffer.length === 1) {
              const target = interpolation.positionBuffer[0].position;
              const speed = 0.1;

              const currentPos = physicsComponent.body.position;
              physicsComponent.body.position.set(
                currentPos.x + (target.x - currentPos.x) * speed,
                currentPos.y + (target.y - currentPos.y) * speed,
                currentPos.z + (target.z - currentPos.z) * speed
              );
            }
          }
        }
      });
    },

    update(ecsAPI, deltaTime) {
      const entities = ecsAPI.getEntitiesWithComponents(
        ComponentTypes.POSITION,
        ComponentTypes.INTERPOLATION,
        ComponentTypes.PLAYER,
        ComponentTypes.PHYSICS_BODY,
        ComponentTypes.VRM
      );

      entities.forEach((entityId) => {
        const position = ecsAPI.getComponent(entityId, ComponentTypes.POSITION);
        const interpolation = ecsAPI.getComponent(
          entityId,
          ComponentTypes.INTERPOLATION
        );
        const player = ecsAPI.getComponent(entityId, ComponentTypes.PLAYER);
        const vrmComponent = ecsAPI.getComponent(entityId, ComponentTypes.VRM);

        if (!player.isLocal) {
          const now = Date.now();
          const renderDelay = 100;
          const renderTime = now - renderDelay;

          // Handle position buffer management (no physics updates here)
          if (interpolation.positionBuffer.length > 0) {
            while (
              interpolation.positionBuffer.length > 2 &&
              interpolation.positionBuffer[1].timestamp <= renderTime
            ) {
              interpolation.positionBuffer.shift();
            }
          }

          // Handle rotation interpolation
          if (vrmComponent && interpolation.rotationBuffer.length > 0) {
            while (
              interpolation.rotationBuffer.length > 2 &&
              interpolation.rotationBuffer[1].timestamp <= renderTime
            ) {
              interpolation.rotationBuffer.shift();
            }

            if (
              interpolation.rotationBuffer.length >= 2 &&
              interpolation.rotationBuffer[0].timestamp <= renderTime &&
              renderTime <= interpolation.rotationBuffer[1].timestamp
            ) {
              const r0 = interpolation.rotationBuffer[0];
              const r1 = interpolation.rotationBuffer[1];
              const t =
                (renderTime - r0.timestamp) / (r1.timestamp - r0.timestamp);

              // Use reusable quaternions instead of creating new ones
              tempQuaternion1.fromArray(r0.rotation);
              tempQuaternion2.fromArray(r1.rotation);

              vrmComponent.vrm.scene.quaternion.slerpQuaternions(
                tempQuaternion1,
                tempQuaternion2,
                t
              );
            } else if (interpolation.rotationBuffer.length === 1) {
              // Use reusable quaternion instead of creating new one
              tempQuaternion1.fromArray(
                interpolation.rotationBuffer[0].rotation
              );
              vrmComponent.vrm.scene.quaternion.slerp(tempQuaternion1, 0.1);
            }
          }
        }
      });
    },
  };
}
