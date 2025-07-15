import * as THREE from "three";
import Stats from "stats.js";

// ECS API for the game
export class ECSApi {
  constructor() {
    this.entities = new Map();
    this.components = new Map();
    this.systems = [];
    this.nextEntityId = 1;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrameId = null;
    this.stats = null;
    
    // Fixed timestep settings
    this.fixedTimeStep = 1 / 60; // 60 Hz
    this.maxSubSteps = 3; // Max physics steps per frame
    this.accumulator = 0;
  }

  createEntity() {
    const id = this.nextEntityId++;
    this.entities.set(id, new Set());
    return id;
  }

  destroyEntity(entityId) {
    const componentTypes = this.entities.get(entityId);
    if (componentTypes) {
      componentTypes.forEach((type) => {
        const storage = this.components.get(type);
        if (storage) {
          storage.delete(entityId);
        }
      });
      this.entities.delete(entityId);
    }
  }

  addComponent(entityId, componentType, data) {
    if (!this.entities.has(entityId)) {
      throw new Error(`Entity ${entityId} does not exist`);
    }

    if (!this.components.has(componentType)) {
      this.components.set(componentType, new Map());
    }

    this.components.get(componentType).set(entityId, data);
    this.entities.get(entityId).add(componentType);
  }

  removeComponent(entityId, componentType) {
    const storage = this.components.get(componentType);
    if (storage) {
      storage.delete(entityId);
    }

    const entity = this.entities.get(entityId);
    if (entity) {
      entity.delete(componentType);
    }
  }

  getComponent(entityId, componentType) {
    const storage = this.components.get(componentType);
    return storage ? storage.get(entityId) : null;
  }

  hasComponent(entityId, componentType) {
    const entity = this.entities.get(entityId);
    return entity ? entity.has(componentType) : false;
  }

  getEntitiesWithComponents(...componentTypes) {
    const result = [];

    for (const [entityId, entityComponents] of this.entities) {
      if (componentTypes.every((type) => entityComponents.has(type))) {
        result.push(entityId);
      }
    }

    return result;
  }

  registerSystem(system) {
    this.systems.push(system);
    if (system.init) {
      system.init(this);
    }
  }

  addSystem(system) {
    return this.registerSystem(system);
  }

  removeSystem(system) {
    console.log('removing system', system);
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      this.systems.splice(index, 1);
    }
  }

  fixedUpdate(fixedDeltaTime) {
    // Update scene manager's fixed update if it exists
    if (this.sceneManager && this.sceneManager.fixedUpdate) {
      this.sceneManager.fixedUpdate(fixedDeltaTime);
    }

    // Call fixedUpdate on all systems that have it
    for (const system of this.systems) {
      if (system.fixedUpdate) {
        system.fixedUpdate(this, fixedDeltaTime);
      }
    }
  }

  update(deltaTime, ...args) {
    // Update scene manager if it exists
    if (this.sceneManager) {
      this.sceneManager.update(deltaTime);
    }

    if (this.stats) this.stats.begin();
    for (const system of this.systems) {
      system.update(this, deltaTime, ...args);
    }
    
    // Update physics debugger if available
    if (this.updatePhysicsDebugger) {
      this.updatePhysicsDebugger();
    }
    
    if (this.stats) this.stats.end();
  }

  findEntityWithComponent(componentType) {
    for (const [entityId, entityComponents] of this.entities) {
      if (entityComponents.has(componentType)) {
        return { id: entityId };
      }
    }
    return null;
  }

  initialize(container) {
    // Three.js setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 5);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.stats = new Stats();
    this.stats.dom.style.position = "absolute";
    this.stats.dom.style.top = "0px";
    this.stats.dom.style.left = "0px";
    this.stats.dom.style.display = "none"; // Start hidden
    container.appendChild(this.stats.dom);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    this.scene.add(directionalLight);

    // Resize handling moved to RenderSystem

  }

  start() {
    if (!this.renderer || !this.scene || !this.camera) {
      throw new Error("World must be initialized before starting");
    }

    let lastTime = 0;
    const animate = (time) => {
      this.animationFrameId = requestAnimationFrame(animate);

      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;

      // Cap deltaTime to prevent spiral of death
      const cappedDeltaTime = Math.min(deltaTime, 0.1);

      // Fixed timestep accumulator pattern
      this.accumulator += cappedDeltaTime;

      // Run fixed updates
      let steps = 0;
      while (this.accumulator >= this.fixedTimeStep && steps < this.maxSubSteps) {
        this.fixedUpdate(this.fixedTimeStep);
        this.accumulator -= this.fixedTimeStep;
        steps++;
      }

      // Calculate interpolation factor for smooth rendering
      const alpha = this.accumulator / this.fixedTimeStep;

      // Run variable timestep update
      this.update(deltaTime, this.camera, alpha);
      this.renderer.render(this.scene, this.camera);
    };

    requestAnimationFrame(animate);
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Call shutdown on all systems that have it
    for (const system of this.systems) {
      if (system.shutdown) {
        system.shutdown();
      }
    }
  }

  toggleStats() {
    if (!this.stats) return;
    const display = this.stats.dom.style.display;
    this.stats.dom.style.display = display === "none" ? "block" : "none";
  }

  reset() {
    this.stop();

    // Clear all entities and their components
    // Create a copy of entities keys to avoid mutation issues while iterating
    const allEntityIds = [...this.entities.keys()];
    allEntityIds.forEach((entityId) => {
      this.destroyEntity(entityId);
    });

    // Remove all objects from the scene
    if (this.scene) {
      for (let i = this.scene.children.length - 1; i >= 0; i--) {
        const object = this.scene.children[i];
        this.scene.remove(object);
        // Dispose of geometries and materials to free memory
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    }

    // Reset entity counter
    this.nextEntityId = 1;

    if (this.stats) {
      this.stats.dom.style.display = "none";
    }

    // Clear component storages
    this.components.clear();
    this.entities.clear();
    this.systems = [];
  }
}
