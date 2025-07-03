import * as THREE from "three";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { World } from "./ecs/World.js";
import { createMovementSystem } from "./ecs/systems/MovementSystem.js";
import { createRenderSystem } from "./ecs/systems/RenderSystem.js";
import { createInputSystem } from "./ecs/systems/InputSystem.js";
import { createNetworkSystem } from "./ecs/systems/NetworkSystem.js";
import { createInterpolationSystem } from "./ecs/systems/InterpolationSystem.js";
import { createPhysicsSystem } from "./ecs/systems/PhysicsSystem.js";
import { createAnimationSystem } from "./ecs/systems/AnimationSystem.js";
import { createPlayer } from "./entities/Player.js";
import { SceneManager } from "./src/SceneManager.js";

// Three.js setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById("canvas-container").appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
scene.add(directionalLight);

// Ground plane removed - using scene GLB instead

// ECS setup
const world = new World();

const physicsSystem = createPhysicsSystem();
world.physicsWorld = physicsSystem.world;

const networkSystem = createNetworkSystem();
const inputSystem = createInputSystem();

world.registerSystem(inputSystem);
world.registerSystem(createMovementSystem());
world.registerSystem(physicsSystem);
world.registerSystem(createInterpolationSystem());
world.registerSystem(createRenderSystem(scene));
world.registerSystem(networkSystem);
world.registerSystem(createAnimationSystem());

window.scene = scene;
window.physicsWorld = physicsSystem.world;

const sceneManager = new SceneManager(
  scene,
  physicsSystem.world,
  world,
  networkSystem
);

// Debug cube removed

// Game manager to bridge React and Three.js
class GameManager {
  constructor() {
    this.localPlayerId = null;
    this.gameStarted = false;
    this.stateCallbacks = null;

    // Set up mobile input callback
    this.mobileInputCallback = (moveVector) => {
      if (inputSystem.handleMobileInput) {
        inputSystem.handleMobileInput(moveVector);
      }
    };

    // Chat message handler placeholder
    this.onChatMessage = null;
  }

  setStateCallbacks(callbacks) {
    this.stateCallbacks = callbacks;

    // Set up network system callbacks
    networkSystem.onConnectionStatusChange = (status) => {
      callbacks.setConnectionStatus(status);
    };

    networkSystem.onConnectionReady = (ready) => {
      callbacks.setPlayEnabled(ready);
    };

    networkSystem.onRoomUpdate = (roomId, playerCount, maxPlayers) => {
      callbacks.updateRoomInfo(roomId, playerCount, maxPlayers);
    };

    networkSystem.onJoinedRoom = (roomData) => {
      console.log("[main] onJoinedRoom called with:", roomData);
      if (roomData.roomType) {
        console.log("[main] Loading room type:", roomData.roomType);
        sceneManager.loadRoom(roomData.roomType);
      } else {
        console.warn("[main] No roomType in roomData");
      }
    };

    networkSystem.onGameStart = () => {
      callbacks.setGameState("playing");
    };

    networkSystem.onDisconnect = () => {
      callbacks.setGameState("menu");
    };

    networkSystem.onPlayerJoined = (playerId) => {
      sceneManager.onPlayerJoin(playerId);
    };

    networkSystem.onPlayerLeft = (playerId) => {
      sceneManager.onPlayerLeave(playerId);
    };

    // Set up chat message handler
    networkSystem.onChatMessage = (message) => {
      if (this.onChatMessage) {
        this.onChatMessage(message);
      }
    };
  }

  async onPlay(playerIdentity, roomType) {
    networkSystem.joinGame(playerIdentity, roomType);
  }

  async startGame(playerIdentity) {
    if (!this.gameStarted) {
      this.localPlayerId = await createPlayer(
        world,
        { x: 0, y: 1.5, z: 0 },
        true,
        physicsSystem.world,
        playerIdentity
      );
      this.gameStarted = true;
      if (this.stateCallbacks) {
        this.stateCallbacks.setGameState("playing");
      }
    }
  }

  stopGame() {
    if (this.gameStarted && this.localPlayerId) {
      const meshComponent = world.getComponent(this.localPlayerId, "mesh");
      if (meshComponent && meshComponent.mesh) {
        scene.remove(meshComponent.mesh);
      }
      const physicsComponent = world.getComponent(
        this.localPlayerId,
        "physicsBody"
      );
      if (physicsComponent && physicsComponent.body) {
        physicsSystem.world.removeBody(physicsComponent.body);
      }
      world.destroyEntity(this.localPlayerId);
      this.localPlayerId = null;
      this.gameStarted = false;
    }
  }

  sendChatMessage(text) {
    networkSystem.sendChatMessage(text);
  }
}

const gameManager = new GameManager();

// Pass game manager to network system
networkSystem.setGameManager(gameManager);

// Bind the send chat message method
gameManager.sendChatMessage = gameManager.sendChatMessage.bind(gameManager);

// Window resize handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
let lastTime = 0;
function animate(time) {
  requestAnimationFrame(animate);

  const deltaTime = (time - lastTime) / 1000;
  lastTime = time;

  sceneManager.update(deltaTime);
  world.update(deltaTime);

  // Simple camera follow for local player
  if (gameManager.localPlayerId) {
    const position = world.getComponent(gameManager.localPlayerId, "position");
    if (position) {
      camera.position.x = position.x;
      camera.position.y = position.y + 2.5;
      camera.position.z = position.z + 2.5;
      camera.lookAt(position.x, position.y, position.z);
    }
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

// React app initialization
const root = ReactDOM.createRoot(document.getElementById("react-root"));
root.render(<App gameManager={gameManager} />);
