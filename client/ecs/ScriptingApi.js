import * as CANNON from "cannon-es";
import { ComponentTypes } from "./components.js";

export class ScriptingAPI {
  constructor(ecsAPI, physicsWorld, loadedScene = null, networkSystem = null, scene = null) {
    this.ecsAPI = ecsAPI;
    this.physicsWorld = physicsWorld;
    this.loadedScene = loadedScene;
    this.networkSystem = networkSystem;
    this.scene = scene;
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
    return this.scene; // Reference to the main Three.js scene
  }

  // Player State Helpers
  getLocalPlayer() {
    const entities = this.ecsAPI.getEntitiesWithComponents(ComponentTypes.PLAYER);
    for (const entityId of entities) {
      const player = this.ecsAPI.getComponent(entityId, ComponentTypes.PLAYER);
      if (player && player.isLocal) {
        return { entityId, player };
      }
    }
    return null;
  }

  isPlayerGrounded(entityId) {
    const player = this.ecsAPI.getComponent(entityId, ComponentTypes.PLAYER);
    return player ? player.isGrounded : false;
  }

  getPlayerVelocity(entityId) {
    const physics = this.ecsAPI.getComponent(entityId, ComponentTypes.PHYSICS_BODY);
    if (physics && physics.body) {
      return {
        x: physics.body.velocity.x,
        y: physics.body.velocity.y,
        z: physics.body.velocity.z
      };
    }
    return null;
  }
}
