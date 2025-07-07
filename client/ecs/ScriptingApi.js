import * as CANNON from "cannon-es";
import * as THREE from "three";
import { ComponentTypes } from "./components.js";
import { loadAnim } from "../src/retarget.js";

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

  // Animation Management
  async loadAnimation(entityId, animationUrl, animationName) {
    const vrm = this.ecsAPI.getComponent(entityId, ComponentTypes.VRM);
    const animation = this.ecsAPI.getComponent(entityId, ComponentTypes.ANIMATION);
    
    if (!vrm || !animation) {
      console.error("Entity must have VRM and Animation components");
      return false;
    }

    try {
      // Load and retarget the animation
      const clip = await loadAnim(animationUrl, vrm.vrm);
      clip.name = animationName;
      
      // Cache the clip
      animation.clips[animationName] = clip;
      
      // Create animation action
      const action = animation.mixer.clipAction(clip);
      animation.actions[animationName] = action;
      
      return true;
    } catch (error) {
      console.error("Failed to load animation:", error);
      return false;
    }
  }

  playAnimation(entityId, animationName, loop = true, persistOnMove = false) {
    const animation = this.ecsAPI.getComponent(entityId, ComponentTypes.ANIMATION);
    
    if (!animation) {
      console.error("Entity must have Animation component");
      return false;
    }

    // Handle stopping override
    if (animationName === null) {
      animation.overrideAction = null;
      animation.overrideActionName = null;
      animation.overridePersistOnMove = false;
      return true;
    }

    // Find the requested action
    const action = animation.actions[animationName];
    if (!action) {
      console.error(`Animation "${animationName}" not found`);
      return false;
    }

    // Configure looping
    action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
    if (!loop) {
      action.clampWhenFinished = true;
    }

    // Set as override
    animation.overrideAction = action;
    animation.overrideActionName = animationName;
    animation.overridePersistOnMove = persistOnMove;
    
    return true;
  }

  // Keyboard Event Management
  onKeyDown(key, callback) {
    if (!this.ecsAPI.keyboardListeners) {
      console.error("Keyboard listeners not initialized. Is InputSystem running?");
      return false;
    }
    
    const normalizedKey = key.toLowerCase();
    
    // Initialize array for this key if it doesn't exist
    if (!this.ecsAPI.keyboardListeners.keydown[normalizedKey]) {
      this.ecsAPI.keyboardListeners.keydown[normalizedKey] = [];
    }
    
    // Add the callback
    this.ecsAPI.keyboardListeners.keydown[normalizedKey].push(callback);
    return true;
  }

  onKeyUp(key, callback) {
    if (!this.ecsAPI.keyboardListeners) {
      console.error("Keyboard listeners not initialized. Is InputSystem running?");
      return false;
    }
    
    const normalizedKey = key.toLowerCase();
    
    // Initialize array for this key if it doesn't exist
    if (!this.ecsAPI.keyboardListeners.keyup[normalizedKey]) {
      this.ecsAPI.keyboardListeners.keyup[normalizedKey] = [];
    }
    
    // Add the callback
    this.ecsAPI.keyboardListeners.keyup[normalizedKey].push(callback);
    return true;
  }

  removeKeyDownListener(key, callback) {
    if (!this.ecsAPI.keyboardListeners || !this.ecsAPI.keyboardListeners.keydown) {
      return false;
    }
    
    const normalizedKey = key.toLowerCase();
    const listeners = this.ecsAPI.keyboardListeners.keydown[normalizedKey];
    
    if (!listeners) {
      return false;
    }
    
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
      
      // Clean up empty arrays
      if (listeners.length === 0) {
        delete this.ecsAPI.keyboardListeners.keydown[normalizedKey];
      }
      return true;
    }
    
    return false;
  }

  removeKeyUpListener(key, callback) {
    if (!this.ecsAPI.keyboardListeners || !this.ecsAPI.keyboardListeners.keyup) {
      return false;
    }
    
    const normalizedKey = key.toLowerCase();
    const listeners = this.ecsAPI.keyboardListeners.keyup[normalizedKey];
    
    if (!listeners) {
      return false;
    }
    
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
      
      // Clean up empty arrays
      if (listeners.length === 0) {
        delete this.ecsAPI.keyboardListeners.keyup[normalizedKey];
      }
      return true;
    }
    
    return false;
  }
}
