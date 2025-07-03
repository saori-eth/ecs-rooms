# Entity Management API

## Entity Operations

### createEntity()
Creates a new entity and returns its ID.
```javascript
const entityId = this.api.createEntity();
```

### destroyEntity(entityId)
Destroys an entity and all its components.
```javascript
this.api.destroyEntity(entityId);
```

### addComponent(entityId, componentType, data)
Adds a component to an entity.
```javascript
this.api.addComponent(entityId, ComponentTypes.POSITION, { x: 0, y: 1, z: 0 });
```

### getComponent(entityId, componentType)
Gets a component from an entity.
```javascript
const position = this.api.getComponent(entityId, ComponentTypes.POSITION);
```

### getEntitiesWithComponents(...componentTypes)
Finds all entities that have ALL specified components.
```javascript
const players = this.api.getEntitiesWithComponents(
  ComponentTypes.PLAYER, 
  ComponentTypes.POSITION
);
```

## Component Types

### POSITION
World position coordinates.
```javascript
{ x: number, y: number, z: number }
```

### VELOCITY
Movement velocity vector.
```javascript
{ x: number, y: number, z: number }
```

### INPUT
Player input state.
```javascript
{ 
  keys: { w: boolean, a: boolean, s: boolean, d: boolean },
  moveVector: { x: number, y: number, z: number }
}
```

### MESH
Three.js mesh reference.
```javascript
{ mesh: THREE.Mesh }
```

### PLAYER
Player-specific data.
```javascript
{ 
  isLocal: boolean,
  speed: number 
}
```

### NETWORK
Network synchronization data.
```javascript
{ 
  id: string,
  lastUpdate: number 
}
```

### PHYSICS_BODY
Cannon-ES physics body.
```javascript
{ body: CANNON.Body }
```

### VRM
VRM avatar model.
```javascript
{ vrm: VRM }
```

### ANIMATION
Animation mixer and controls.
```javascript
{ 
  mixer: THREE.AnimationMixer,
  clips: Map,
  actions: Map,
  currentAction: string
}
```