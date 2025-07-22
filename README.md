# Three.js ECS Game Engine

A multiplayer 3D game engine built with Three.js, ECS architecture, and WebSocket networking.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
# Start server (port 3001)
npm run server

# Start client (port 5173)
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Architecture

### ECS (Entity Component System)
- **Entities**: Unique IDs representing game objects
- **Components**: Data containers (position, velocity, mesh, etc.)
- **Systems**: Logic that operates on entities with specific components

### Multiplayer
- WebSocket-based real-time communication
- MessagePack binary encoding for efficient data transfer
- Room-based sessions (4 players max)
- Automatic position/animation synchronization
- Custom game events for gameplay logic

### Key Features
- GLTF/GLB 3D model support
- Cannon-ES physics integration
- VRM avatar support with animations
- Dynamic room/scene loading
- Scripting system for game logic

Example room:
```javascript
"my-game": {
  name: "My Game",
  sceneModel: "/models/my-scene.glb",
  script: "/rooms/scripts/my-game.js",
  enablePhysics: true
}
```

## License
MIT