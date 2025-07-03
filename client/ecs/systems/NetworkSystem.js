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
  let gameStateManager = null
  let roomId = null
  let inRoom = false

  const connect = () => {
    ws = new WebSocket('ws://localhost:8080')
    
    ws.onopen = () => {
      console.log('Connected to server')
      connected = true
      
      if (gameStateManager) {
        gameStateManager.setConnectionStatus('Connected')
        gameStateManager.enablePlayButton(true)
      }
      
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
          
          if (gameStateManager) {
            gameStateManager.setState('playing')
            gameStateManager.updateRoomInfo(roomId, message.players.length + 1, message.maxPlayers)
          }
          
          message.players.forEach(playerData => {
            const remoteEntityId = createPlayer(world, playerData.position, false, window.physicsWorld)
            world.addComponent(remoteEntityId, ComponentTypes.INTERPOLATION, createInterpolationComponent())
            remotePlayers.set(playerData.id, remoteEntityId)
          })
          break
          
        case 'playerJoined':
          if (inRoom) {
            const newEntityId = createPlayer(world, message.player.position, false, window.physicsWorld)
            world.addComponent(newEntityId, ComponentTypes.INTERPOLATION, createInterpolationComponent())
            remotePlayers.set(message.player.id, newEntityId)
            console.log(`Player ${message.player.id} joined`)
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
            if (interpolation) {
              interpolation.positionBuffer.push({
                position: {
                  x: message.position.x,
                  y: message.position.y,
                  z: message.position.z
                },
                timestamp: message.timestamp || Date.now()
              })
              
              if (interpolation.positionBuffer.length > 20) {
                interpolation.positionBuffer.shift()
              }
            }
          }
          break
          
        case 'roomUpdate':
          if (gameStateManager) {
            gameStateManager.updateRoomInfo(roomId, message.playerCount, message.maxPlayers)
          }
          break
      }
    }
    
    ws.onclose = () => {
      console.log('Disconnected from server')
      connected = false
      inRoom = false
      roomId = null
      
      if (gameStateManager) {
        gameStateManager.setConnectionStatus('Disconnected. Reconnecting...')
        gameStateManager.enablePlayButton(false)
        gameStateManager.setState('menu')
      }
      
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
      if (gameStateManager) {
        gameStateManager.setConnectionStatus('Connection error')
      }
    }
  }

  return {
    init(w) {
      world = w
      connect()
    },
    
    setGameStateManager(gsm) {
      gameStateManager = gsm
    },
    
    joinGame() {
      if (connected && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'joinGame' }))
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
          
          ws.send(JSON.stringify({
            type: 'move',
            position: {
              x: position.x,
              y: position.y,
              z: position.z
            },
            timestamp: Date.now()
          }))
        }
      })
    }
  }
}