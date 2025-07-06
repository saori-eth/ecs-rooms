import * as CANNON from "cannon-es";
import { ComponentTypes } from "./components.js";

export class ScriptingAPI {
  constructor(ecsAPI, physicsWorld, loadedScene = null, networkSystem = null) {
    this.ecsAPI = ecsAPI;
    this.physicsWorld = physicsWorld;
    this.loadedScene = loadedScene;
    this.networkSystem = networkSystem;
    this.gameObjects = new Map(); // Track game objects by ID
  }

  // Entity and Component Access
  createEntity() {
    return this.ecsAPI.createEntity();
  }

  destroyEntity(entityId) {
    this.ecsAPI.destroyEntity(entityId);
  }

  addComponent(entityId, componentType, data) {
    this.ecsAPI.addComponent(entityId, componentType, data);
  }

  getComponent(entityId, componentType) {
    return this.ecsAPI.getComponent(entityId, componentType);
  }

  getEntitiesWithComponents(...componentTypes) {
    return this.ecsAPI.getEntitiesWithComponents(...componentTypes);
  }

  // Network Events
  sendGameEvent(eventType, data) {
    if (this.networkSystem) {
      this.networkSystem.sendGameEvent(eventType, data);
    }
  }

  // Camera Control
  setCameraTarget(entityId) {
    // First, remove cameraTarget from any other entity
    const currentTargets = this.ecsAPI.getEntitiesWithComponents(
      ComponentTypes.CAMERA_TARGET
    );
    for (const target of currentTargets) {
      this.ecsAPI.removeComponent(target, ComponentTypes.CAMERA_TARGET);
    }

    if (entityId !== null && this.ecsAPI.entities.has(entityId)) {
      // Set new entity as target
      this.ecsAPI.addComponent(entityId, ComponentTypes.CAMERA_TARGET, {});
    } else {
      // Reset to local player if entityId is null or invalid
      const localPlayer = this.ecsAPI.findEntityWithComponent(
        ComponentTypes.PLAYER
      );
      if (localPlayer) {
        const playerComponent = this.ecsAPI.getComponent(
          localPlayer.id,
          ComponentTypes.PLAYER
        );
        if (playerComponent && playerComponent.isLocal) {
          this.ecsAPI.addComponent(
            localPlayer.id,
            ComponentTypes.CAMERA_TARGET,
            {}
          );
        }
      }
    }
  }

  // Game Object Management
  registerGameObject(id, entityId) {
    this.gameObjects.set(id, entityId);
  }

  getGameObject(id) {
    return this.gameObjects.get(id);
  }

  removeGameObject(id) {
    const entityId = this.gameObjects.get(id);
    if (entityId) {
      this.destroyEntity(entityId);
      this.gameObjects.delete(id);
    }
  }

  // Physics Helpers
  createPhysicsBody(shape, position, mass = 0) {
    const body = new CANNON.Body({
      mass: mass,
      shape: shape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
    });
    this.physicsWorld.addBody(body);
    return body;
  }

  removePhysicsBody(body) {
    this.physicsWorld.removeBody(body);
  }

  // Visual Helpers
  getThreeScene() {
    return window.scene; // Reference to the main Three.js scene
  }
}
