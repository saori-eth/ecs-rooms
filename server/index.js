import { WebSocketServer } from 'ws'

const PORT = 8080
const wss = new WebSocketServer({ port: PORT })

const MAX_PLAYERS_PER_ROOM = 4
const rooms = new Map()
let nextRoomId = 1
let nextClientId = 1

class Room {
  constructor(id) {
    this.id = id
    this.players = new Map()
    this.state = 'waiting'
  }
  
  addPlayer(client) {
    this.players.set(client.id, client)
    client.roomId = this.id
    
    if (this.players.size >= MAX_PLAYERS_PER_ROOM) {
      this.state = 'full'
    }
  }
  
  removePlayer(clientId) {
    this.players.delete(clientId)
    this.state = 'waiting'
    
    if (this.players.size === 0) {
      return true
    }
    return false
  }
  
  broadcast(message, excludeId = null) {
    this.players.forEach((client) => {
      if (client.id !== excludeId && client.ws.readyState === 1) {
        client.ws.send(JSON.stringify(message))
      }
    })
  }
  
  getPlayerList() {
    return Array.from(this.players.values()).map(client => ({
      id: client.id,
      position: client.position
    }))
  }
}

function findOrCreateRoom() {
  for (const [roomId, room] of rooms) {
    if (room.state === 'waiting') {
      return room
    }
  }
  
  const newRoom = new Room(`room-${nextRoomId++}`)
  rooms.set(newRoom.id, newRoom)
  return newRoom
}

console.log(`WebSocket server listening on port ${PORT}`)

wss.on('connection', (ws) => {
  const clientId = nextClientId++
  const client = {
    id: clientId,
    ws: ws,
    position: { x: 0, y: 2, z: 0 },
    roomId: null,
    lastHeartbeat: Date.now()
  }
  
  console.log(`Client ${clientId} connected`)
  
  ws.send(JSON.stringify({
    type: 'connected',
    id: clientId
  }))
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      
      switch (message.type) {
        case 'joinGame':
          const room = findOrCreateRoom()
          room.addPlayer(client)
          
          ws.send(JSON.stringify({
            type: 'joinedRoom',
            roomId: room.id,
            playerId: clientId,
            players: room.getPlayerList().filter(p => p.id !== clientId),
            maxPlayers: MAX_PLAYERS_PER_ROOM
          }))
          
          room.broadcast({
            type: 'playerJoined',
            player: {
              id: clientId,
              position: client.position
            }
          }, clientId)
          
          room.broadcast({
            type: 'roomUpdate',
            playerCount: room.players.size,
            maxPlayers: MAX_PLAYERS_PER_ROOM
          })
          
          ws.send(JSON.stringify({
            type: 'roomUpdate',
            playerCount: room.players.size,
            maxPlayers: MAX_PLAYERS_PER_ROOM
          }))
          
          console.log(`Client ${clientId} joined ${room.id} (${room.players.size}/${MAX_PLAYERS_PER_ROOM})`)
          break
          
        case 'move':
          if (client.roomId) {
            client.position = message.position
            const room = rooms.get(client.roomId)
            
            if (room) {
              room.broadcast({
                type: 'playerMoved',
                id: clientId,
                position: message.position,
                timestamp: Date.now()
              }, clientId)
            }
          }
          break
          
        case 'heartbeat':
          client.lastHeartbeat = Date.now()
          ws.send(JSON.stringify({ type: 'heartbeatAck' }))
          break
      }
    } catch (error) {
      console.error('Error processing message:', error)
    }
  })
  
  ws.on('close', () => {
    console.log(`Client ${clientId} disconnected`)
    
    if (client.roomId) {
      const room = rooms.get(client.roomId)
      if (room) {
        const shouldDeleteRoom = room.removePlayer(clientId)
        
        if (shouldDeleteRoom) {
          rooms.delete(room.id)
          console.log(`Room ${room.id} deleted (empty)`)
        } else {
          room.broadcast({
            type: 'playerLeft',
            id: clientId
          })
          
          room.broadcast({
            type: 'roomUpdate',
            playerCount: room.players.size,
            maxPlayers: MAX_PLAYERS_PER_ROOM
          })
        }
      }
    }
  })
  
  ws.on('error', (error) => {
    console.error(`Client ${clientId} error:`, error)
  })
})

setInterval(() => {
  const now = Date.now()
  const timeout = 30000
  
  rooms.forEach((room) => {
    room.players.forEach((client, id) => {
      if (now - client.lastHeartbeat > timeout) {
        console.log(`Client ${id} timed out`)
        client.ws.close()
      }
    })
  })
}, 5000)