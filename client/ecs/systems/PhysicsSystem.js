import * as CANNON from "cannon-es";
import { ComponentTypes } from "../components.js";

export function createPhysicsSystem() {
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -35, 0),
  });
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 20;

  // Ground removed - using scene collision instead
  // Player material is created in SceneManager for scene collision

  // Store previous physics states for interpolation
  const previousStates = new Map();

  return {
    world,

    // Fixed timestep update - only steps the physics simulation
    fixedUpdate(ecsWorld, fixedDeltaTime) {
      // Store previous positions before physics step
      const entities = ecsWorld.getEntitiesWithComponents(
        ComponentTypes.PHYSICS_BODY,
        ComponentTypes.POSITION,
        ComponentTypes.PLAYER
      );

      entities.forEach((entityId) => {
        const physicsComponent = ecsWorld.getComponent(
          entityId,
          ComponentTypes.PHYSICS_BODY
        );
        const player = ecsWorld.getComponent(entityId, ComponentTypes.PLAYER);

        // Only store state for local player
        if (physicsComponent.body && player && player.isLocal) {
          previousStates.set(entityId, {
            x: physicsComponent.body.position.x,
            y: physicsComponent.body.position.y,
            z: physicsComponent.body.position.z,
            vx: physicsComponent.body.velocity.x,
            vy: physicsComponent.body.velocity.y,
            vz: physicsComponent.body.velocity.z,
          });
        }
      });

      world.step(fixedDeltaTime);
    },

    // Variable timestep update - interpolates physics bodies to ECS positions
    update(ecsWorld, deltaTime, camera, alpha = 1) {
      const entities = ecsWorld.getEntitiesWithComponents(
        ComponentTypes.PHYSICS_BODY,
        ComponentTypes.POSITION
      );

      entities.forEach((entityId) => {
        const physicsComponent = ecsWorld.getComponent(
          entityId,
          ComponentTypes.PHYSICS_BODY
        );
        const position = ecsWorld.getComponent(
          entityId,
          ComponentTypes.POSITION
        );
        const player = ecsWorld.getComponent(entityId, ComponentTypes.PLAYER);

        if (physicsComponent.body && player && player.isLocal) {
          // Check if we have previous state for the local player
          if (previousStates.has(entityId)) {
            const prevState = previousStates.get(entityId);
            const currentBody = physicsComponent.body;

            // Interpolate between previous and current physics positions
            position.x =
              prevState.x + (currentBody.position.x - prevState.x) * alpha;
            position.y =
              prevState.y + (currentBody.position.y - prevState.y) * alpha;
            position.z =
              prevState.z + (currentBody.position.z - prevState.z) * alpha;
          } else {
            // For local player when no previous state, use current position
            position.x = physicsComponent.body.position.x;
            position.y = physicsComponent.body.position.y;
            position.z = physicsComponent.body.position.z;
          }
        }
      });
    },
  };
}
