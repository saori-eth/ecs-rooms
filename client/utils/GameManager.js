import { createPlayer } from "../entities/Player.js";

// Game manager to bridge React and Three.js
export class GameManager {
  constructor({
    networkSystem,
    inputSystem,
    sceneManager,
    world,
    physicsSystem,
    animationSystem,
    scene,
  }) {
    this.localPlayerId = null;
    this.gameStarted = false;
    this.stateCallbacks = null;
    this.networkSystem = networkSystem;
    this.inputSystem = inputSystem;
    this.sceneManager = sceneManager;
    this.world = world;
    this.physicsSystem = physicsSystem;
    this.animationSystem = animationSystem;
    this.scene = scene;

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
    this.networkSystem.onConnectionStatusChange = (status) => {
      callbacks.setConnectionStatus(status);
    };

    this.networkSystem.onConnectionReady = (ready) => {
      callbacks.setPlayEnabled(ready);
    };

    this.networkSystem.onRoomUpdate = (roomId, playerCount, maxPlayers) => {
      callbacks.updateRoomInfo(roomId, playerCount, maxPlayers);
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
      // callbacks.setGameState("playing");
    };

    this.networkSystem.onDisconnect = () => {
      // Reset animation system notification flag
      this.animationSystem.notifiedIdle = false;
      callbacks.setGameState("menu");
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

  async onPlay(playerIdentity, roomType) {
    this.networkSystem.joinGame(playerIdentity, roomType);
  }

  async startGame(playerIdentity) {
    if (!this.gameStarted) {
      this.localPlayerId = await createPlayer(
        this.world,
        { x: 0, y: 1.5, z: 0 },
        true,
        this.physicsSystem.world,
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
      const meshComponent = this.world.getComponent(this.localPlayerId, "mesh");
      if (meshComponent && meshComponent.mesh) {
        this.scene.remove(meshComponent.mesh);
      }
      const physicsComponent = world.getComponent(
        this.localPlayerId,
        "physicsBody"
      );
      if (physicsComponent && physicsComponent.body) {
        this.physicsSystem.world.removeBody(physicsComponent.body);
      }
      this.world.destroyEntity(this.localPlayerId);
      this.localPlayerId = null;
      this.gameStarted = false;

      // Reset animation system notification flag
      this.animationSystem.notifiedIdle = false;
    }
  }

  sendChatMessage(text) {
    this.networkSystem.sendChatMessage(text);
  }
}
