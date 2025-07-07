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

  return {
    world,

    // Fixed timestep update - only steps the physics simulation
    fixedUpdate(ecsWorld, fixedDeltaTime) {
      world.step(fixedDeltaTime);
    },

    // Variable timestep update - syncs physics bodies to ECS positions
    update(ecsWorld, deltaTime) {
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

        if (physicsComponent.body) {
          position.x = physicsComponent.body.position.x;
          position.y = physicsComponent.body.position.y;
          position.z = physicsComponent.body.position.z;
        }
      });
    },
  };
}
