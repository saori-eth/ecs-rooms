# Scene Setup Guide

## Overview
Scenes are 3D environments where gameplay takes place. Each room can have its own scene model, physics configuration, and associated script.

## Room Definition
Define rooms in `/client/rooms/room-definitions.js`:

```javascript
export const rooms = {
  "room-id": {
    name: "Display Name",
    sceneModel: "/path/to/model.glb",
    script: "/rooms/scripts/script-name.js",
    sceneTransform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    },
    enablePhysics: true
  }
};
```

## Scene Properties

### sceneModel
- Path to GLTF/GLB 3D model file
- Models should be optimized for web (< 10MB recommended)
- Place models in `/public/models/` directory

### sceneTransform
- **position**: World position offset (x, y, z)
- **rotation**: Rotation in radians (x, y, z)
- **scale**: Scale multiplier (x, y, z)

### enablePhysics
- `true`: Generates trimesh collision bodies from all meshes
- `false`: No collision, players can walk through objects

## Physics Setup
When `enablePhysics` is enabled:
- Each mesh gets an automatic trimesh collider
- Material properties: friction: 0.4, restitution: 0.1
- Contact material with players: friction: 0.4, restitution: 0

## Best Practices
1. Keep models under 10MB for faster loading
2. Use LODs for complex scenes
3. Bake lighting into textures when possible
4. Test physics performance with complex geometry
5. Use simple collision meshes for better performance