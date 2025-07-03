# Networking API

## Event System

### sendGameEvent(eventType, data)
Sends a custom game event to all players in the room.
```javascript
this.api.sendGameEvent('spawnEnemy', {
  position: { x: 10, y: 0, z: -5 },
  type: 'zombie',
  health: 100
});
```

### onGameEvent Handler
Set up in constructor to handle incoming events.
```javascript
constructor(scriptingAPI) {
  this.api = scriptingAPI;
  
  this.api.networkSystem.onGameEvent = (event) => {
    switch(event.eventType) {
      case 'spawnEnemy':
        this.handleSpawnEnemy(event.data);
        break;
      case 'playerScore':
        this.updateScore(event.playerId, event.data);
        break;
    }
  };
}
```

## Event Structure
```javascript
{
  eventType: string,    // Your custom event name
  playerId: string,     // ID of player who sent event
  data: any            // Your custom data
}
```

## Network Properties

### Local Player ID
```javascript
const myId = this.api.localPlayerId;
```

### Player Network Component
```javascript
const network = this.api.getComponent(playerId, ComponentTypes.NETWORK);
// network.id - Player's network ID
// network.lastUpdate - Timestamp of last update
```

## Synchronization Patterns

### Host-Authoritative
Only the host spawns/controls certain objects:
```javascript
if (this.isHost()) {
  const enemyId = this.spawnEnemy();
  this.api.sendGameEvent('enemySpawned', {
    id: enemyId,
    position: {...}
  });
}
```

### Peer-to-Peer
All players can create objects:
```javascript
// Any player can shoot
onShoot() {
  const bulletId = this.createBullet();
  this.api.sendGameEvent('bulletFired', {
    id: bulletId,
    position: {...},
    velocity: {...}
  });
}
```

## Best Practices
1. Keep event data small
2. Use unique IDs for spawned objects
3. Handle duplicate events gracefully
4. Validate incoming data
5. Clean up on player disconnect