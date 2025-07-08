import { createPlayer } from "./entities/Player.js";
import { ECSApi } from "./ECSApi.js";
import { createMovementSystem } from "./systems/MovementSystem.js";
import { createRenderSystem } from "./systems/RenderSystem.js";
import { createInputSystem } from "./systems/InputSystem.js";
import { createNetworkSystem } from "./systems/NetworkSystem.js";
import { createInterpolationSystem } from "./systems/InterpolationSystem.js";
import { createPhysicsSystem } from "./systems/PhysicsSystem.js";
import { createAnimationSystem } from "./systems/AnimationSystem.js";
import { SceneManager } from "./SceneManager.js";
import { CameraSystem } from "./systems/CameraSystem.js";
import { VRMManager } from "../src/VRMLoader.js";
import { AnimationManager } from "../src/AnimationManager.js";

// Dynamic import for development-only dependency
let CannonDebugger = null;
if (import.meta.env.DEV) {
  try {
    CannonDebugger = (await import("cannon-es-debugger")).default;
  } catch (e) {
    console.warn("cannon-es-debugger not available");
  }
}

// Game manager to bridge React and Three.js
export class ECSManager {
  constructor() {
    this.localPlayerId = null;
    this.gameStarted = false;
    this.stateCallbacks = null;
    this.inputSystem = null;
    this.sceneManager = null;
    this.ecsAPI = null;
    this.physicsSystem = null;
    this.animationSystem = null;
    this.scene = null;
    this.initialized = false;
    this.vrmManager = null;
    this.animationManager = null;
    this.physicsDebugger = null;

    // Set up mobile input callback
    this.mobileInputCallback = null;
    this.mobileJumpCallback = null;

    // Chat message handler placeholder
    this.onChatMessage = null;

    // Create network system early for connection status
    this.networkSystem = createNetworkSystem();
    // Connect immediately for connection status in menu
    this.networkSystem.connect();
  }

  setStateCallbacks(callbacks) {
    this.stateCallbacks = callbacks;

    // Always set up network callbacks since network system exists from constructor
    this.setupNetworkCallbacks();
  }

  async onPlay(playerIdentity, roomType) {
    this.networkSystem.joinGame(playerIdentity, roomType);
  }

  async startGame(playerIdentity) {
    if (!this.gameStarted) {
      this.localPlayerId = await createPlayer(
        this.ecsAPI,
        { x: 0, y: 1.5, z: 0 },
        true,
        this.physicsSystem.world,
        playerIdentity,
        this.vrmManager,
        this.animationManager,
        this.scene
      );
      this.gameStarted = true;
      if (this.stateCallbacks) {
        this.stateCallbacks.setGameState("playing");
      }
    }
  }

  stopGame() {
    if (this.gameStarted && this.localPlayerId) {
      const meshComponent = this.ecsAPI.getComponent(
        this.localPlayerId,
        "mesh"
      );
      if (meshComponent && meshComponent.mesh) {
        this.scene.remove(meshComponent.mesh);
      }
      const physicsComponent = this.ecsAPI.getComponent(
        this.localPlayerId,
        "physicsBody"
      );
      if (physicsComponent && physicsComponent.body) {
        this.physicsSystem.world.removeBody(physicsComponent.body);
      }
      this.ecsAPI.destroyEntity(this.localPlayerId);
      this.localPlayerId = null;
      this.gameStarted = false;

      // Reset animation system notification flag
      this.animationSystem.notifiedIdle = false;
    }
  }

  sendChatMessage(text) {
    this.networkSystem.sendChatMessage(text);
  }

  reset() {
    // Stop the game and clean up player
    this.stopGame();

    // Disconnect from network
    if (this.networkSystem) {
      this.networkSystem.disconnect();
    }

    // Reset the ECS ecsAPI
    if (this.ecsAPI) {
      this.ecsAPI.reset();
      // Stop the animation loop
      this.ecsAPI.stop();
    }

    // Reset scene manager
    if (this.sceneManager) {
      this.sceneManager.reset();
    }

    // Clean up managers
    if (this.animationManager) {
      this.animationManager.dispose();
      this.animationManager = null;
    }

    this.vrmManager = null;

    // Remove renderer canvas from DOM
    if (
      this.ecsAPI &&
      this.ecsAPI.renderer &&
      this.ecsAPI.renderer.domElement
    ) {
      const canvas = this.ecsAPI.renderer.domElement;
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      this.ecsAPI.renderer.dispose();
      this.ecsAPI.renderer = null;
    }

    // Reset ecsManager state
    this.gameStarted = false;
    this.localPlayerId = null;
    this.initialized = false;

    if (this.animationSystem) {
      this.animationSystem.notifiedIdle = false;
    }

    // Clear all system references
    this.physicsSystem = null;
    this.inputSystem = null;
    this.animationSystem = null;
    this.ecsAPI = null;
    this.scene = null;
    this.sceneManager = null;
  }

  async initialize(container) {
    if (this.initialized) {
      console.warn("ecsManager already initialized");
      return;
    }

    // Create managers
    this.vrmManager = new VRMManager();
    this.animationManager = new AnimationManager();

    // Create the ECS ecsAPI
    this.ecsAPI = new ECSApi();

    // Initialize Three.js components
    this.ecsAPI.initialize(container);
    this.scene = this.ecsAPI.scene;

    // Create all systems
    this.physicsSystem = createPhysicsSystem();
    this.ecsAPI.physicsWorld = this.physicsSystem.world;

    // Create physics debugger only in development mode
    if (CannonDebugger) {
      this.physicsDebugger = new CannonDebugger(
        this.scene,
        this.physicsSystem.world,
        {
          color: 0x0000ff,
          scale: 1.0,
        }
      );
    } else {
      this.physicsDebugger = null;
    }

    // Network system already created in constructor
    // Update its ecsAPI reference and scene
    this.networkSystem.init(this.ecsAPI, this.scene);

    this.inputSystem = createInputSystem();
    this.animationSystem = createAnimationSystem();

    // Register systems with the ecsAPI
    this.ecsAPI.registerSystem(this.inputSystem);
    this.ecsAPI.registerSystem(this.physicsSystem);
    this.ecsAPI.registerSystem(createMovementSystem());
    this.ecsAPI.registerSystem(createInterpolationSystem());
    this.ecsAPI.registerSystem(this.networkSystem);
    this.ecsAPI.registerSystem(createRenderSystem(this.scene));
    this.ecsAPI.registerSystem(this.animationSystem);

    // Create and register camera system
    this.cameraSystem = new CameraSystem();
    this.ecsAPI.addSystem(this.cameraSystem);


    // Add update method to ECSApi for physics debugger
    this.ecsAPI.updatePhysicsDebugger = () => {
      if (this.physicsDebugger) {
        // Comment/uncomment the line below to enable/disable physics debugging
        // this.physicsDebugger.update();
      }
    };

    // Create scene manager
    this.sceneManager = new SceneManager(
      this.scene,
      this.physicsSystem.world,
      this.ecsAPI,
      this.networkSystem
    );
    // Pass scene and physics world references to networkSystem
    this.networkSystem.setScene(this.scene);
    this.networkSystem.setPhysicsWorld(this.physicsSystem.world);

    // Set sceneManager reference in ecsAPI for update calls
    this.ecsAPI.sceneManager = this.sceneManager;

    // Pass game manager to network system
    this.networkSystem.setecsManager(this);

    // Bind the send chat message method
    this.sendChatMessage = this.sendChatMessage.bind(this);

    // Set up mobile input callback
    this.mobileInputCallback = (moveVector) => {
      if (this.inputSystem && this.inputSystem.handleMobileInput) {
        this.inputSystem.handleMobileInput(moveVector);
      }
    };

    // Set up mobile jump callback
    this.mobileJumpCallback = () => {
      if (this.inputSystem && this.inputSystem.handleMobileJump) {
        this.inputSystem.handleMobileJump();
      }
    };

    // Set up animation system callback to transition from loading to playing
    this.animationSystem.onLocalPlayerIdleAnimation = () => {
      if (this.stateCallbacks) {
        this.stateCallbacks.setGameState("playing");
      }
    };

    // Set up network system callbacks if stateCallbacks already exist
    if (this.stateCallbacks) {
      this.setupNetworkCallbacks();
    }

    // Start the game loop
    this.ecsAPI.start();

    this.initialized = true;
  }

  setupNetworkCallbacks() {
    if (!this.networkSystem || !this.stateCallbacks) return;

    this.networkSystem.onConnectionStatusChange = (status) => {
      this.stateCallbacks.setConnectionStatus(status);
    };

    this.networkSystem.onConnectionReady = (ready) => {
      this.stateCallbacks.setPlayEnabled(ready);
    };

    this.networkSystem.onRoomUpdate = (roomId, playerCount, maxPlayers) => {
      this.stateCallbacks.updateRoomInfo(roomId, playerCount, maxPlayers);
    };

    this.networkSystem.onJoinedRoom = (roomData) => {
      if (roomData.roomType) {
        this.sceneManager.loadRoom(roomData.roomType);
      } else {
        console.warn("[main] No roomType in roomData");
      }
    };

    this.networkSystem.onGameStart = () => {
      // Don't set playing state here anymore - wait for idle animation
    };

    this.networkSystem.onDisconnect = () => {
      this.reset();
      this.stateCallbacks.setGameState("menu");
    };

    this.networkSystem.onPlayerJoined = (playerId) => {
      this.sceneManager.onPlayerJoin(playerId);
    };

    this.networkSystem.onPlayerLeft = (playerId) => {
      this.sceneManager.onPlayerLeave(playerId);
    };

    // Set up chat message handler
    this.networkSystem.onChatMessage = (message) => {
      if (this.onChatMessage) {
        this.onChatMessage(message);
      }
    };
  }

  async reloadSceneScript() {
    if (this.sceneManager) {
      await this.sceneManager.reloadActiveScript();
    }
  }
}
