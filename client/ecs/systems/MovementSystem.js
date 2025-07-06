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
  
  // For raycasting ground check
  const rayFrom = new CANNON.Vec3();
  const rayTo = new CANNON.Vec3();

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
        
        // Get physics world from ecsAPI
        const physicsWorld = ecsAPI.physicsWorld;
        if (!physicsWorld) return;
        
        // Ground check using raycast
        let isGrounded = false;
        const bodyPosition = physicsComponent.body.position;
        rayFrom.set(bodyPosition.x, bodyPosition.y, bodyPosition.z);
        rayTo.set(bodyPosition.x, bodyPosition.y - 1.1, bodyPosition.z); // Slightly more than half player height
        
        // First, let's try a different approach - cast ray from below the player's feet
        const ray = new CANNON.Ray(rayFrom, rayTo);
        const rayResult = new CANNON.RaycastResult();
        
        // Store all bodies except the player's
        const bodiesToTest = [];
        physicsWorld.bodies.forEach(body => {
          if (body !== physicsComponent.body) {
            bodiesToTest.push(body);
          }
        });
        
        // Manually test intersection with each body except the player's
        let closestHit = null;
        let closestDistance = Infinity;
        
        bodiesToTest.forEach(body => {
          const result = new CANNON.RaycastResult();
          ray.intersectBody(body, result);
          
          if (result.hasHit && result.distance < closestDistance) {
            closestDistance = result.distance;
            closestHit = result;
          }
        });
        
        if (closestHit) {
          rayResult.body = closestHit.body;
          rayResult.distance = closestHit.distance;
          rayResult.hasHit = true;
          rayResult.hitPointWorld.copy(closestHit.hitPointWorld);
        }
        
        isGrounded = rayResult.hasHit;
        
        // Store grounded state on the player component
        player.isGrounded = isGrounded;
        
        // Handle jump
        if (isGrounded && ecsAPI.inputState && ecsAPI.inputState.jump) {
          physicsComponent.body.velocity.y = 5; // Jump velocity
          ecsAPI.inputState.jump = false; // Reset jump flag
        } else if (!isGrounded && ecsAPI.inputState && ecsAPI.inputState.jump) {
          ecsAPI.inputState.jump = false; // Reset jump flag even when not grounded
        }
        
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
