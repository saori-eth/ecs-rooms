import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { rooms } from "./rooms/room-definitions.js";
import { ScriptingAPI } from "./ScriptingApi.js";
import { loadGameScript } from "./ScriptLoader.js";

export class SceneManager {
  constructor(scene, physicsWorld, ecsAPI, networkSystem) {
    this.threeScene = scene;
    this.physicsWorld = physicsWorld;
    this.ecsAPI = ecsAPI; // ECS World
    this.networkSystem = networkSystem;
    this.loader = new GLTFLoader();
    this.activeRoom = null;
    this.activeScript = null;
    this.sceneObjects = [];
    this.physicsBodies = [];
  }

  async loadRoom(roomType) {
    if (this.activeRoom === roomType) {
      return;
    }

    this.unloadCurrentRoom();

    const roomData = rooms[roomType];
    if (!roomData) {
      console.error(`Room type "${roomType}" not found.`);
      return;
    }
    this.activeRoom = roomType;

    // Load 3D Scene
    if (roomData.sceneModel) {
      try {
        const gltf = await this.loader.loadAsync(
          roomData.sceneModel,
          // onProgress callback
          (xhr) => {}
        );
        // Apply scene transform FIRST, before any physics calculations
        if (roomData.sceneTransform) {
          const transform = roomData.sceneTransform;
          if (transform.position) {
            gltf.scene.position.set(
              transform.position.x || 0,
              transform.position.y || 0,
              transform.position.z || 0
            );
          }
          if (transform.rotation) {
            gltf.scene.rotation.set(
              transform.rotation.x || 0,
              transform.rotation.y || 0,
              transform.rotation.z || 0
            );
          }
          if (transform.scale) {
            gltf.scene.scale.set(
              transform.scale.x || 1,
              transform.scale.y || 1,
              transform.scale.z || 1
            );
          }
        }

        // Update matrices after transform
        gltf.scene.updateMatrixWorld(true);

        // Create collision material for the scene
        const sceneMaterial = new CANNON.Material("sceneMaterial");
        sceneMaterial.friction = 0.4;
        sceneMaterial.restitution = 0.1;

        // Create contact material between player and scene
        // Note: We'll use the same material name as in Player.js
        const playerMaterial = new CANNON.Material("playerMaterial");
        const scenePlayerContact = new CANNON.ContactMaterial(
          playerMaterial,
          sceneMaterial,
          {
            friction: 0.3,
            restitution: 0.0,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3,
          }
        );
        this.physicsWorld.addContactMaterial(scenePlayerContact);

        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Create trimesh collision for each mesh
            if (child.geometry && roomData.enablePhysics !== false) {
              const vertices = [];
              const indices = [];

              // Get vertex positions
              const positionAttribute = child.geometry.attributes.position;
              for (let i = 0; i < positionAttribute.count; i++) {
                vertices.push(
                  positionAttribute.getX(i),
                  positionAttribute.getY(i),
                  positionAttribute.getZ(i)
                );
              }

              // Get indices
              if (child.geometry.index) {
                for (let i = 0; i < child.geometry.index.count; i++) {
                  indices.push(child.geometry.index.getX(i));
                }
              } else {
                // Generate indices for non-indexed geometry
                for (let i = 0; i < positionAttribute.count; i++) {
                  indices.push(i);
                }
              }

              // Create trimesh shape
              const trimeshShape = new CANNON.Trimesh(vertices, indices);

              // Create physics body
              const trimeshBody = new CANNON.Body({
                mass: 0, // Static body
                shape: trimeshShape,
                material: sceneMaterial,
              });

              // Apply the same transforms as the visual mesh
              child.updateWorldMatrix(true, false);
              const worldPos = new THREE.Vector3();
              const worldQuat = new THREE.Quaternion();
              const worldScale = new THREE.Vector3();
              child.matrixWorld.decompose(worldPos, worldQuat, worldScale);

              trimeshBody.position.set(worldPos.x, worldPos.y, worldPos.z);
              trimeshBody.quaternion.set(
                worldQuat.x,
                worldQuat.y,
                worldQuat.z,
                worldQuat.w
              );

              // Add to physics ecsAPI
              this.physicsWorld.addBody(trimeshBody);
              this.physicsBodies.push(trimeshBody);
            }
          }
        });

        // Transform already applied above
        this.threeScene.add(gltf.scene);
        this.sceneObjects.push(gltf.scene);
        // Debug: Calculate and log scene bounds
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        // Store reference to the loaded scene for the script
        this.loadedScene = gltf.scene;
      } catch (error) {
        console.error("[SceneManager] Error loading model:", error);
        console.error("[SceneManager] Error details:", error.message);
        console.error("[SceneManager] Model path was:", roomData.sceneModel);

        // Try alternative path without leading slash
        if (roomData.sceneModel.startsWith("/")) {
          const altPath = roomData.sceneModel.substring(1);
          try {
            const gltf = await this.loader.loadAsync(altPath);
            // Continue with the loaded model...
            this.threeScene.add(gltf.scene);
            this.sceneObjects.push(gltf.scene);
            this.loadedScene = gltf.scene;
            return;
          } catch (altError) {
            console.error(
              "[SceneManager] Alternative path also failed:",
              altError
            );
          }
        }
      }
    }

    // Load and instantiate script
    if (roomData.script) {
      try {
        const scriptModule = await loadGameScript(roomData.script);
        const ScriptClass = Object.values(scriptModule)[0];
        const scriptingAPI = new ScriptingAPI(
          this.ecsAPI,
          this.physicsWorld,
          this.loadedScene,
          this.networkSystem
        );
        this.activeScript = new ScriptClass(scriptingAPI);
        if (this.activeScript.onLoad) {
          this.activeScript.onLoad();
        }
      } catch (e) {
        console.error(
          `[SceneManager] Failed to load script for room ${roomType}:`,
          e
        );
        console.error("[SceneManager] Script path was:", roomData.script);
        console.error("[SceneManager] Error stack:", e.stack);
      }
    } else {
    }
  }

  unloadCurrentRoom() {
    // Remove visual objects
    this.sceneObjects.forEach((obj) => {
      this.threeScene.remove(obj);
    });
    this.sceneObjects = [];

    // Remove physics bodies
    this.physicsBodies.forEach((body) => this.physicsWorld.removeBody(body));
    this.physicsBodies = [];

    this.activeRoom = null;
    this.activeScript = null;
    this.loadedScene = null;
  }

  update(deltaTime) {
    if (this.activeScript && this.activeScript.onUpdate) {
      this.activeScript.onUpdate(deltaTime);
    } else if (this.activeScript) {
    } else {
    }
  }

  onPlayerJoin(playerId) {
    if (this.activeScript && this.activeScript.onPlayerJoin) {
      this.activeScript.onPlayerJoin(playerId);
    }
  }

  onPlayerLeave(playerId) {
    if (this.activeScript && this.activeScript.onPlayerLeave) {
      this.activeScript.onPlayerLeave(playerId);
    }
  }

  reset() {
    this.unloadCurrentRoom();
    this.activeRoom = null;
    this.activeScript = null;
  }
}
