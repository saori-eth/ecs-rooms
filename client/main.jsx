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
import { GameManager } from "./utils/GameManager.js";
import { SceneManager } from "./src/SceneManager.js";
import { CameraSystem } from "./ecs/systems/CameraSystem.js";

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

const animationSystem = createAnimationSystem();

world.registerSystem(inputSystem);
world.registerSystem(createMovementSystem());
world.registerSystem(physicsSystem);
world.registerSystem(createInterpolationSystem());
world.registerSystem(createRenderSystem(scene));
world.registerSystem(networkSystem);
world.registerSystem(animationSystem);
world.addSystem(new CameraSystem());

window.scene = scene;
window.physicsWorld = physicsSystem.world;

const sceneManager = new SceneManager(
  scene,
  physicsSystem.world,
  world,
  networkSystem
);

// Debug cube removed

const gameManager = new GameManager({
  networkSystem,
  inputSystem,
  sceneManager,
  world,
  physicsSystem,
  animationSystem,
  scene,
});

// Pass game manager to network system
networkSystem.setGameManager(gameManager);

// Bind the send chat message method
gameManager.sendChatMessage = gameManager.sendChatMessage.bind(gameManager);

// Set up animation system callback to transition from loading to playing
animationSystem.onLocalPlayerIdleAnimation = () => {
  if (gameManager && gameManager.stateCallbacks) {
    gameManager.stateCallbacks.setGameState("playing");
  }
};

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
  world.update(deltaTime, camera);

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

// React app initialization
const root = ReactDOM.createRoot(document.getElementById("react-root"));
root.render(<App gameManager={gameManager} />);
