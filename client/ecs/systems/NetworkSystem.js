import { ComponentTypes, createInterpolationComponent } from "../components.js";
import { createPlayer } from "../entities/Player.js";
import { pack, unpack } from "../../encoding.js";

export function createNetworkSystem() {
  let ws = null;
  let localPlayerId = null;
  let ecsAPI = null;
  let scene = null;
  let physicsWorld = null;
  let connected = false;
  let heartbeatInterval = null;
  let lastUpdateTime = 0;
  const updateRate = 50;
  const remotePlayers = new Map();
  let ecsManager = null;
  let roomId = null;
  let inRoom = false;

  // Callback functions
  let onConnectionStatusChange = null;
  let onConnectionReady = null;
  let onRoomUpdate = null;
  let onGameStart = null;
  let onDisconnect = null;
  let onChatMessage = null;
  let onJoinedRoom = null;
  let onGameEvent = null;
  let onPlayerJoined = null;
  let onPlayerLeft = null;

  const connect = () => {
    // Use wss:// for production, ws:// for development
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

    // In development, the client runs on port 3000/3001/etc but WebSocket server is on 8080
    let host = window.location.host;
    if (
      window.location.hostname === "localhost" &&
      (window.location.port === "3000" ||
        window.location.port === "3001" ||
        window.location.port === "3002")
    ) {
      host = "localhost:8080";
    }

    const wsUrl = `${protocol}//${host}`;
    ws = new WebSocket(wsUrl);

    ws.binaryType = "arraybuffer";
    
    ws.onopen = () => {
      console.log("Connected to server");
      connected = true;

      if (onConnectionStatusChange) onConnectionStatusChange("Connected");
      if (onConnectionReady) onConnectionReady(true);

      heartbeatInterval = setInterval(() => {
        if (connected) {
          ws.send(pack({ type: "heartbeat" }));
        }
      }, 10000);
    };

    ws.onmessage = (event) => {
      const message = unpack(event.data);

      switch (message.type) {
        case "connected":
          localPlayerId = message.id;
          break;

        case "joinedRoom":
          localPlayerId = message.playerId;
          roomId = message.roomId;
          inRoom = true;
          console.log(`Joined ${roomId}`);

          if (onJoinedRoom) {
            // Pass the whole message as it contains roomType
            onJoinedRoom(message);
          }

          if (onGameStart) {
            onGameStart();
          }
          if (onRoomUpdate) {
            onRoomUpdate(
              roomId,
              message.players.length + 1,
              message.maxPlayers
            );
          }

          if (ecsManager) {
            const identity = ecsManager.stateCallbacks.getPlayerIdentity();
            ecsManager.startGame(identity);
          }

          message.players.forEach(async (playerData) => {
            const remoteEntityId = await createPlayer(
              ecsAPI,
              playerData.position,
              false,
              physicsWorld,
              playerData.identity,
              ecsManager?.vrmManager,
              ecsManager?.animationManager,
              scene
            );
            ecsAPI.addComponent(
              remoteEntityId,
              ComponentTypes.INTERPOLATION,
              createInterpolationComponent()
            );
            remotePlayers.set(playerData.id, remoteEntityId);
          });
          break;

        case "playerJoined":
          if (inRoom) {
            createPlayer(
              ecsAPI,
              message.player.position,
              false,
              physicsWorld,
              message.player.identity,
              ecsManager?.vrmManager,
              ecsManager?.animationManager,
              scene
            ).then((newEntityId) => {
              ecsAPI.addComponent(
                newEntityId,
                ComponentTypes.INTERPOLATION,
                createInterpolationComponent()
              );
              remotePlayers.set(message.player.id, newEntityId);
              console.log(`Player ${message.player.id} joined`);
              if (onPlayerJoined) {
                onPlayerJoined(message.player.id);
              }
            });
          }
          break;

        case "playerLeft":
          const leavingEntityId = remotePlayers.get(message.id);
          if (leavingEntityId) {
            const meshComponent = ecsAPI.getComponent(
              leavingEntityId,
              ComponentTypes.MESH
            );
            if (meshComponent && meshComponent.mesh && scene) {
              scene.remove(meshComponent.mesh);
            }
            const physicsComponent = ecsAPI.getComponent(
              leavingEntityId,
              ComponentTypes.PHYSICS_BODY
            );
            if (physicsComponent && physicsComponent.body) {
              physicsWorld.removeBody(physicsComponent.body);
            }
            ecsAPI.destroyEntity(leavingEntityId);
            remotePlayers.delete(message.id);
            console.log(`Player ${message.id} left`);
            if (onPlayerLeft) {
              onPlayerLeft(message.id);
            }
          }
          break;

        case "playerMoved":
          const movingEntityId = remotePlayers.get(message.id);
          if (movingEntityId) {
            const interpolation = ecsAPI.getComponent(
              movingEntityId,
              ComponentTypes.INTERPOLATION
            );
            const animation = ecsAPI.getComponent(
              movingEntityId,
              ComponentTypes.ANIMATION
            );

            if (interpolation) {
              // Push position data to position buffer
              interpolation.positionBuffer.push({
                position: {
                  x: message.position.x,
                  y: message.position.y,
                  z: message.position.z,
                },
                timestamp: message.timestamp,
              });

              // Push rotation data to rotation buffer
              interpolation.rotationBuffer.push({
                rotation: message.rotation,
                timestamp: message.timestamp,
              });

              // Maintain buffer sizes
              if (interpolation.positionBuffer.length > 20) {
                interpolation.positionBuffer.shift();
              }
              if (interpolation.rotationBuffer.length > 20) {
                interpolation.rotationBuffer.shift();
              }
            }

            if (animation && animation.actions) {
              let actionToPlay;
              
              // Determine which animation to play based on received state
              if (message.isGrounded === false && animation.actions.jump) {
                actionToPlay = animation.actions.jump;
              } else if (message.isMoving && message.isSprinting && animation.actions.sprint) {
                actionToPlay = animation.actions.sprint;
              } else if (message.isMoving && animation.actions.walking) {
                actionToPlay = animation.actions.walking;
              } else if (animation.actions.idle) {
                actionToPlay = animation.actions.idle;
              }
              
              if (actionToPlay !== animation.currentAction) {
                const lastAction = animation.currentAction;
                animation.currentAction = actionToPlay;
                
                // Use faster transition for jump animation
                const fadeTime = actionToPlay === animation.actions.jump ? 0.1 : 0.2;
                lastAction.fadeOut(fadeTime);
                actionToPlay.reset().fadeIn(fadeTime).play();
              }
            }
          }
          break;

        case "roomUpdate":
          if (onRoomUpdate && inRoom) {
            onRoomUpdate(roomId, message.playerCount, message.maxPlayers);
          }
          break;

        case "chatMessage":
          if (onChatMessage) {
            onChatMessage({
              author: message.author,
              text: message.text,
              timestamp: message.timestamp,
            });
          } else {
            console.error("[NetworkSystem] No onChatMessage handler!");
          }
          break;

        case "gameEvent":
          if (onGameEvent) {
            onGameEvent({
              eventType: message.eventType,
              data: message.data,
              playerId: message.playerId,
              timestamp: message.timestamp,
            });
          } else {
            console.error("[NetworkSystem] No onGameEvent handler!");
          }
          break;
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from server");
      connected = false;
      inRoom = false;
      roomId = null;

      if (onConnectionStatusChange)
        onConnectionStatusChange("Disconnected. Reconnecting...");
      if (onConnectionReady) onConnectionReady(false);
      if (onDisconnect) onDisconnect();
      if (ecsManager) ecsManager.stopGame();

      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }

      remotePlayers.forEach((entityId) => {
        const meshComponent = ecsAPI.getComponent(
          entityId,
          ComponentTypes.MESH
        );
        if (meshComponent && meshComponent.mesh && scene) {
          scene.remove(meshComponent.mesh);
        }
        const physicsComponent = ecsAPI.getComponent(
          entityId,
          ComponentTypes.PHYSICS_BODY
        );
        if (physicsComponent && physicsComponent.body && physicsWorld) {
          physicsWorld.removeBody(physicsComponent.body);
        }
        ecsAPI.destroyEntity(entityId);
      });
      remotePlayers.clear();

      setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      console.error("WebSocket readyState:", ws.readyState);
      console.error("WebSocket URL:", ws.url);
      if (onConnectionStatusChange) {
        onConnectionStatusChange("Connection error");
      }
    };
  };

  const networkSystem = {
    init(w, s) {
      ecsAPI = w;
      scene = s;
      if (!ws) {
        connect();
      }
    },

    connect() {
      if (!ws) {
        connect();
      }
    },

    setecsManager(gm) {
      ecsManager = gm;
    },

    setScene(s) {
      scene = s;
    },

    setPhysicsWorld(pw) {
      physicsWorld = pw;
    },

    joinGame(identity, roomType) {
      if (connected && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          pack({
            type: "joinGame",
            identity: identity,
            roomType: roomType,
          })
        );
      }
    },

    sendChatMessage(text) {
      if (connected && ws && ws.readyState === WebSocket.OPEN && inRoom) {
        const message = {
          type: "chatMessage",
          text: text,
        };
        ws.send(pack(message));
      } else {
        console.error(
          "[NetworkSystem] Cannot send chat message - not connected or not in room"
        );
      }
    },

    sendGameEvent(eventType, data) {
      if (connected && ws && ws.readyState === WebSocket.OPEN && inRoom) {
        const message = {
          type: "gameEvent",
          eventType: eventType,
          data: data,
        };
        ws.send(pack(message));
      } else {
        console.error(
          "[NetworkSystem] Cannot send game event - not connected or not in room"
        );
      }
    },

    disconnect() {
      if (ws) {
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        ws.close();
        ws = null;
        connected = false;
        inRoom = false;
        roomId = null;
        remotePlayers.clear();
      }
    },

    update(ecsAPI, deltaTime) {
      if (!connected || !ws || ws.readyState !== WebSocket.OPEN || !inRoom)
        return;

      const now = Date.now();
      if (now - lastUpdateTime < updateRate) return;
      lastUpdateTime = now;

      const localPlayers = ecsAPI.getEntitiesWithComponents(
        ComponentTypes.POSITION,
        ComponentTypes.PLAYER
      );

      localPlayers.forEach((entityId) => {
        const player = ecsAPI.getComponent(entityId, ComponentTypes.PLAYER);
        if (player.isLocal) {
          const position = ecsAPI.getComponent(
            entityId,
            ComponentTypes.POSITION
          );
          const input = ecsAPI.getComponent(entityId, ComponentTypes.INPUT);
          const vrm = ecsAPI.getComponent(entityId, ComponentTypes.VRM);

          if (position && input && vrm) {
            const isMoving =
              input.moveVector.x !== 0 || input.moveVector.z !== 0;
            const isSprinting = ecsAPI.inputState && ecsAPI.inputState.sprint;
            const isGrounded = player.isGrounded === true; // Will be false if undefined or false
            
            const moveMessage = {
              type: "move",
              position: {
                x: position.x,
                y: position.y,
                z: position.z,
              },
              rotation: vrm.vrm.scene.quaternion.toArray(),
              isMoving,
              isSprinting,
              isGrounded,
              timestamp: Date.now(),
            };
            
            ws.send(pack(moveMessage));
          }
        }
      });
    },
  };

  // Define setter properties
  Object.defineProperty(networkSystem, "onConnectionStatusChange", {
    set(callback) {
      onConnectionStatusChange = callback;
    },
  });

  Object.defineProperty(networkSystem, "onConnectionReady", {
    set(callback) {
      onConnectionReady = callback;
    },
  });

  Object.defineProperty(networkSystem, "onRoomUpdate", {
    set(callback) {
      onRoomUpdate = callback;
    },
  });

  Object.defineProperty(networkSystem, "onGameStart", {
    set(callback) {
      onGameStart = callback;
    },
  });

  Object.defineProperty(networkSystem, "onDisconnect", {
    set(callback) {
      onDisconnect = callback;
    },
  });

  Object.defineProperty(networkSystem, "onChatMessage", {
    set(callback) {
      onChatMessage = callback;
    },
  });

  Object.defineProperty(networkSystem, "onJoinedRoom", {
    set(callback) {
      onJoinedRoom = callback;
    },
  });

  Object.defineProperty(networkSystem, "onGameEvent", {
    set(callback) {
      onGameEvent = callback;
    },
  });

  Object.defineProperty(networkSystem, "onPlayerJoined", {
    set(callback) {
      onPlayerJoined = callback;
    },
  });

  Object.defineProperty(networkSystem, "onPlayerLeft", {
    set(callback) {
      onPlayerLeft = callback;
    },
  });

  return networkSystem;
}
