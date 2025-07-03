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
- Room-based sessions (4 players max)
- Automatic position/animation synchronization
- Custom game events for gameplay logic

### Key Features
- GLTF/GLB 3D model support
- Cannon-ES physics integration
- VRM avatar support with animations
- Dynamic room/scene loading
- Scripting system for game logic

## Documentation

- [Scene Setup](docs/scenes.md) - How to create and configure 3D scenes
- [Scripting Guide](docs/scripting.md) - Writing game logic scripts
- [Entity API](docs/api/entities.md) - Entity and component management
- [Physics API](docs/api/physics.md) - Physics bodies and collision
- [Networking API](docs/api/networking.md) - Multiplayer events and sync
- [Visual API](docs/api/visual.md) - Three.js scene and rendering

## Project Structure
```
client/
├── src/
│   ├── systems/         # ECS systems
│   ├── ecs/            # Core ECS implementation
│   ├── rooms/          # Room definitions
│   └── main.js         # Entry point
public/
├── models/             # 3D models (GLTF/GLB)
├── rooms/
│   └── scripts/        # Game logic scripts
server/
└── index.js           # WebSocket server
```

## Creating a Game

1. **Add 3D model** to `/public/models/`
2. **Define room** in `/client/rooms/room-definitions.js`
3. **Write script** in `/public/rooms/scripts/`
4. **Test** by joining the room

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