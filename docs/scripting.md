# Scripting Guide

## Overview

Scripts define the game logic for each room. They handle player interactions, game state, physics, and networking.

## Script Structure

Create scripts in `/public/rooms/scripts/`:

```javascript
export class YourScript {
  constructor(scriptingAPI) {
    this.api = scriptingAPI;
    // Initialize state
  }

  onLoad() {
    // Setup when room loads
  }

  onUpdate(deltaTime) {
    // Called every frame
    // deltaTime in seconds
  }

  onPlayerJoin(playerId) {
    // Player joined room
  }

  onPlayerLeave(playerId) {
    // Player left room
  }
}
```

## Core Concepts

### Host Logic

The first player acts as the "host" and handles:

- Spawning enemies/items
- Game state management
- Physics simulations for shared objects

```javascript
isHost() {
  const players = this.api.getEntitiesWithComponents(
    ComponentTypes.PLAYER, ComponentTypes.NETWORK
  );
  if (players.length === 0) return false;

  const myNetwork = this.api.getComponent(this.api.localPlayerId, ComponentTypes.NETWORK);
  return players[0] === this.api.localPlayerId;
}
```

### Entity Management

```javascript
// Create entity
const entityId = this.api.createEntity();

// Add components
this.api.addComponent(entityId, ComponentTypes.POSITION, { x: 0, y: 1, z: 0 });

// Get component
const pos = this.api.getComponent(entityId, ComponentTypes.POSITION);

// Destroy entity
this.api.destroyEntity(entityId);
```

### Physics Objects

```javascript
// Create physics body
const shape = new CANNON.Sphere(0.5);
const body = this.api.createPhysicsBody(shape, { x: 0, y: 5, z: 0 }, mass);

// Add to entity
this.api.addComponent(entityId, ComponentTypes.PHYSICS_BODY, { body });
```

### Network Events

```javascript
// Send event
this.api.sendGameEvent("spawn", {
  type: "enemy",
  position: { x: 0, y: 0, z: 0 },
});

// Handle events
this.api.networkSystem.onGameEvent = (event) => {
  if (event.eventType === "spawn") {
    this.spawnObject(event.data);
  }
};
```

## Example: Collectible System

```javascript
export class CollectibleGame {
  constructor(scriptingAPI) {
    this.api = scriptingAPI;
    this.collectibles = new Map();
  }

  onLoad() {
    // Only host spawns collectibles
    if (this.isHost()) {
      this.spawnCollectibles();
    }

    // All players handle collection
    this.api.networkSystem.onGameEvent = (event) => {
      if (event.eventType === "collect") {
        this.removeCollectible(event.data.id);
      }
    };
  }

  onUpdate(deltaTime) {
    // Check collisions
    const playerPos = this.api.getComponent(
      this.api.localPlayerId,
      ComponentTypes.POSITION
    );

    for (const [id, data] of this.collectibles) {
      const distance = this.getDistance(playerPos, data.position);
      if (distance < 1.0) {
        this.api.sendGameEvent("collect", { id });
      }
    }
  }

  onFixedUpdate(deltaTime) {
    // deal with physics updaets here
  }
}
```

## Best Practices

1. Always check if you're the host before spawning objects
2. Sync important state changes via network events
3. Clean up entities and physics bodies on destroy
4. Use object pooling for frequently spawned items
5. Handle player disconnections gracefully
