import { ComponentTypes, createInterpolationComponent } from '../components.js'
import { createPlayer } from '../../entities/Player.js'

export function createNetworkSystem() {
  let ws = null
  let localPlayerId = null
  let world = null
  let connected = false
  let heartbeatInterval = null
  let lastUpdateTime = 0
  const updateRate = 50
  const remotePlayers = new Map()
  let gameManager = null
  let roomId = null
  let inRoom = false
  
  // Callback functions
  let onConnectionStatusChange = null
  let onConnectionReady = null
  let onRoomUpdate = null
  let onGameStart = null
  let onDisconnect = null

  const connect = () => {
    ws = new WebSocket('ws://localhost:8080')
    
    ws.onopen = () => {
      console.log('Connected to server')
      connected = true
      
      if (onConnectionStatusChange) onConnectionStatusChange('Connected')
      if (onConnectionReady) onConnectionReady(true)
      
      heartbeatInterval = setInterval(() => {
        if (connected) {
          ws.send(JSON.stringify({ type: 'heartbeat' }))
        }
      }, 10000)
    }
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      
      switch (message.type) {
        case 'connected':
          localPlayerId = message.id
          console.log(`Assigned client ID: ${localPlayerId}`)
          break
          
        case 'joinedRoom':
          roomId = message.roomId
          inRoom = true
          console.log(`Joined ${roomId}`)
          
          if (onGameStart) {
            onGameStart()
          }
          if (onRoomUpdate) {
            onRoomUpdate(roomId, message.players.length + 1, message.maxPlayers)
          }
          
          if (gameManager) {
            const identity = gameManager.stateCallbacks.getPlayerIdentity()
            gameManager.startGame(identity)
          }
          
          message.players.forEach(async playerData => {
            const remoteEntityId = await createPlayer(world, playerData.position, false, window.physicsWorld, playerData.identity)
            world.addComponent(remoteEntityId, ComponentTypes.INTERPOLATION, createInterpolationComponent())
            remotePlayers.set(playerData.id, remoteEntityId)
          })
          break
          
        case 'playerJoined':
          if (inRoom) {
            createPlayer(world, message.player.position, false, window.physicsWorld, message.player.identity).then(newEntityId => {
              world.addComponent(newEntityId, ComponentTypes.INTERPOLATION, createInterpolationComponent())
              remotePlayers.set(message.player.id, newEntityId)
              console.log(`Player ${message.player.id} joined`)
            })
          }
          break
          
        case 'playerLeft':
          const leavingEntityId = remotePlayers.get(message.id)
          if (leavingEntityId) {
            const meshComponent = world.getComponent(leavingEntityId, ComponentTypes.MESH)
            if (meshComponent && meshComponent.mesh) {
              window.scene.remove(meshComponent.mesh)
            }
            const physicsComponent = world.getComponent(leavingEntityId, ComponentTypes.PHYSICS_BODY)
            if (physicsComponent && physicsComponent.body) {
              window.physicsWorld.removeBody(physicsComponent.body)
            }
            world.destroyEntity(leavingEntityId)
            remotePlayers.delete(message.id)
            console.log(`Player ${message.id} left`)
          }
          break
          
        case 'playerMoved':
          const movingEntityId = remotePlayers.get(message.id)
          if (movingEntityId) {
            const interpolation = world.getComponent(movingEntityId, ComponentTypes.INTERPOLATION)
            const animation = world.getComponent(movingEntityId, ComponentTypes.ANIMATION)
            
            if (interpolation) {
              interpolation.positionBuffer.push({
                position: {
                  x: message.position.x,
                  y: message.position.y,
                  z: message.position.z
                },
                rotation: message.rotation,
                timestamp: message.timestamp
              })
              
              if (interpolation.positionBuffer.length > 20) {
                interpolation.positionBuffer.shift()
              }
              if (interpolation.rotationBuffer.length > 20) {
                interpolation.rotationBuffer.shift()
              }
            }
            
            if (animation && message.isMoving !== undefined) {
              const actionToPlay = message.isMoving ? animation.actions.walking : animation.actions.idle
              if (actionToPlay !== animation.currentAction) {
                const lastAction = animation.currentAction
                animation.currentAction = actionToPlay
                lastAction.fadeOut(0.2)
                animation.currentAction.reset().fadeIn(0.2).play()
              }
            }
          }
          break
          
        case 'roomUpdate':
          if (onRoomUpdate && inRoom) {
            onRoomUpdate(roomId, message.playerCount, message.maxPlayers)
          }
          break
      }
    }
    
    ws.onclose = () => {
      console.log('Disconnected from server')
      connected = false
      inRoom = false
      roomId = null
      
      if (onConnectionStatusChange) onConnectionStatusChange('Disconnected. Reconnecting...')
      if (onConnectionReady) onConnectionReady(false)
      if (onDisconnect) onDisconnect()
      if (gameManager) gameManager.stopGame()
      
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
        heartbeatInterval = null
      }
      
      remotePlayers.forEach((entityId) => {
        const meshComponent = world.getComponent(entityId, ComponentTypes.MESH)
        if (meshComponent && meshComponent.mesh) {
          window.scene.remove(meshComponent.mesh)
        }
        const physicsComponent = world.getComponent(entityId, ComponentTypes.PHYSICS_BODY)
        if (physicsComponent && physicsComponent.body) {
          window.physicsWorld.removeBody(physicsComponent.body)
        }
        world.destroyEntity(entityId)
      })
      remotePlayers.clear()
      
      setTimeout(connect, 3000)
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      if (onConnectionStatusChange) {
        onConnectionStatusChange('Connection error')
      }
    }
  }

  const networkSystem = {
    init(w) {
      world = w
      connect()
    },
    
    setGameManager(gm) {
      gameManager = gm
    },
    
    joinGame(identity) {
      if (connected && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'joinGame',
          identity: identity
        }))
      }
    },

    update(world, deltaTime) {
      if (!connected || !ws || ws.readyState !== WebSocket.OPEN || !inRoom) return
      
      const now = Date.now()
      if (now - lastUpdateTime < updateRate) return
      lastUpdateTime = now
      
      const localPlayers = world.getEntitiesWithComponents(
        ComponentTypes.POSITION,
        ComponentTypes.PLAYER
      )
      
      localPlayers.forEach(entityId => {
        const player = world.getComponent(entityId, ComponentTypes.PLAYER)
        if (player.isLocal) {
          const position = world.getComponent(entityId, ComponentTypes.POSITION)
          const input = world.getComponent(entityId, ComponentTypes.INPUT)
          const vrm = world.getComponent(entityId, ComponentTypes.VRM)
          
          if (position && input && vrm) {
            const isMoving = input.moveVector.x !== 0 || input.moveVector.z !== 0
            ws.send(JSON.stringify({
              type: 'move',
              position: {
                x: position.x,
                y: position.y,
                z: position.z
              },
              rotation: vrm.vrm.scene.quaternion.toArray(),
              isMoving,
              timestamp: Date.now()
            }))
          }
        }
      })
    }
  }
  
  // Define setter properties
  Object.defineProperty(networkSystem, 'onConnectionStatusChange', {
    set(callback) {
      onConnectionStatusChange = callback
    }
  })
  
  Object.defineProperty(networkSystem, 'onConnectionReady', {
    set(callback) {
      onConnectionReady = callback
    }
  })
  
  Object.defineProperty(networkSystem, 'onRoomUpdate', {
    set(callback) {
      onRoomUpdate = callback
    }
  })
  
  Object.defineProperty(networkSystem, 'onGameStart', {
    set(callback) {
      onGameStart = callback
    }
  })
  
  Object.defineProperty(networkSystem, 'onDisconnect', {
    set(callback) {
      onDisconnect = callback
    }
  })
  
  return networkSystem
}