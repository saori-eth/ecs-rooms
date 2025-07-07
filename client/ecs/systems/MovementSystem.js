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
  const ray = new CANNON.Ray();
  const intersectionResult = new CANNON.RaycastResult();
  const closestHitResult = new CANNON.RaycastResult();
  const bodiesToTest = [];

  return {
    // Movement logic runs in fixed timestep for physics stability
    fixedUpdate(ecsAPI, fixedDeltaTime) {
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

        // Apply sprint modifier if sprinting
        const baseSpeed = player.speed;
        const sprintMultiplier = 1.5; // 50% faster when sprinting
        const moveSpeed =
          ecsAPI.inputState && ecsAPI.inputState.sprint
            ? baseSpeed * sprintMultiplier
            : baseSpeed;

        const { x, z } = input.moveVector;

        // Get physics world from ecsAPI
        const physicsWorld = ecsAPI.physicsWorld;
        if (!physicsWorld) return;

        // Ground check using raycast
        let isGrounded = false;
        const bodyPosition = physicsComponent.body.position;
        rayFrom.set(bodyPosition.x, bodyPosition.y, bodyPosition.z);
        rayTo.set(bodyPosition.x, bodyPosition.y - 1.1, bodyPosition.z); // Slightly more than half player height

        ray.from.copy(rayFrom);
        ray.to.copy(rayTo);

        // Store all bodies except the player's
        bodiesToTest.length = 0;
        physicsWorld.bodies.forEach((body) => {
          if (body !== physicsComponent.body) {
            bodiesToTest.push(body);
          }
        });

        // Manually test intersection with each body except the player's
        let closestDistance = Infinity;
        closestHitResult.reset();

        bodiesToTest.forEach((body) => {
          intersectionResult.reset();
          ray.intersectBody(body, intersectionResult);

          if (
            intersectionResult.hasHit &&
            intersectionResult.distance < closestDistance
          ) {
            closestDistance = intersectionResult.distance;
            closestHitResult.hasHit = intersectionResult.hasHit;
            closestHitResult.distance = intersectionResult.distance;
            closestHitResult.body = intersectionResult.body;
            closestHitResult.hitPointWorld.copy(
              intersectionResult.hitPointWorld
            );
            closestHitResult.hitNormalWorld.copy(
              intersectionResult.hitNormalWorld
            );
          }
        });

        isGrounded = closestHitResult.hasHit;

        // Check if we're on a slope
        let isOnSlope = false;
        let slopeNormal = null;
        if (closestHitResult.hasHit && closestHitResult.hitNormalWorld) {
          slopeNormal = closestHitResult.hitNormalWorld;
          // If the normal's Y component is less than 0.95, we're on a slope (not flat ground)
          isOnSlope = slopeNormal.y < 0.95 && slopeNormal.y > 0.5;
        }

        // Store grounded state on the player component
        player.isGrounded = isGrounded;
        player.isOnSlope = isOnSlope;

        // Dynamic friction adjustment based on movement state
        if (physicsComponent.body.material) {
          if (isGrounded && x === 0 && z === 0) {
            // Player is idle on ground - high friction to prevent sliding
            physicsComponent.body.material.friction = 1.0;
          } else if (isGrounded && (x !== 0 || z !== 0)) {
            // Player is moving on ground - very low friction for smooth movement
            physicsComponent.body.material.friction = 0.0;
          }
          // Keep default friction value when in air
        }

        // Handle jump
        if (isGrounded && ecsAPI.inputState && ecsAPI.inputState.jump) {
          physicsComponent.body.velocity.y = 12; // Jump velocity
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

        // Check if on slope and not moving to prevent sliding
        if (isGrounded && x === 0 && z === 0) {
          // Stop completely when not moving on ground
          physicsComponent.body.velocity.set(0, currentVelocity.y, 0);
        } else if (!isGrounded && (x !== 0 || z !== 0)) {
          // In air with input - blend current velocity with desired velocity for air control
          const airControlFactor = 0.15; // Much lower air control
          const desiredVelX = rotatedVector.x * moveSpeed;
          const desiredVelZ = rotatedVector.z * moveSpeed;

          physicsComponent.body.velocity.set(
            currentVelocity.x * (1 - airControlFactor) +
              desiredVelX * airControlFactor,
            currentVelocity.y,
            currentVelocity.z * (1 - airControlFactor) +
              desiredVelZ * airControlFactor
          );
        } else if (isGrounded) {
          // On ground - full control
          physicsComponent.body.velocity.set(
            rotatedVector.x * moveSpeed,
            currentVelocity.y,
            rotatedVector.z * moveSpeed
          );
        }

        // Store the target direction for visual rotation in update loop
        if (vrmComponent) {
          // Clone the rotatedVector to store it on the component
          vrmComponent.targetDirection = rotatedVector.clone();
        }

        physicsComponent.body.velocity.y = Math.max(
          -17.5,
          physicsComponent.body.velocity.y
        );
      });
    },

    // Visual updates run at render framerate
    update(ecsAPI, deltaTime) {
      // Handle character rotation visuals
      const entities = ecsAPI.getEntitiesWithComponents(ComponentTypes.VRM);

      entities.forEach((entityId) => {
        const vrmComponent = ecsAPI.getComponent(entityId, ComponentTypes.VRM);

        if (
          vrmComponent &&
          vrmComponent.vrm &&
          vrmComponent.targetDirection &&
          (vrmComponent.targetDirection.x !== 0 ||
            vrmComponent.targetDirection.z !== 0)
        ) {
          const angle =
            Math.atan2(
              vrmComponent.targetDirection.x,
              vrmComponent.targetDirection.z
            ) + Math.PI;
          tempQuaternion.setFromAxisAngle(yAxis, angle);
          vrmComponent.vrm.scene.quaternion.slerp(tempQuaternion, 0.15);
        }
      });
    },
  };
}
