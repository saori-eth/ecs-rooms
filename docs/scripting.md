# Room Scripts

This directory contains all room scripts that are loaded dynamically by the game.

## How It Works

Scripts are imported through the ScriptLoader.js module, which maintains a registry of available scripts. This approach allows:

1. Proper module resolution (importing npm packages like "three")
2. Build-time optimization and bundling
3. Type checking and linting
4. Tree shaking of unused code

## Adding New Scripts

1. Create your script file in this directory
2. Register your room and script in `client/ecs/rooms/room-definitions.js`.

## Room Definitions (`room-definitions.js`)

The `client/ecs/rooms/room-definitions.js` file is where you define the properties for each room. Here's an example of a room definition:

```javascript
"arena-empty": {
  name: "Empty Room",
  description: "Testing purposes",
  camera: "basic",
  sceneModel: "/environments/arena.glb",
  script: "/rooms/scripts/arena-logic.js",
  sceneTransform: {
    position: { x: 0, y: -1, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  },
},
```

- **`name`**: The display name of the room.
- **`description`**: A short description of the room.
- **`camera`**: The camera mode to use (e.g., "tps", "fps", "basic").
- **`sceneModel`**: The path to the 3D model for the room's environment.
- **`script`**: The path to the JavaScript file that contains the room's logic.
- **`sceneTransform`**: An optional object to position, rotate, and scale the scene model.

## Scripting API Lifecycle

Your script class must implement some or all of the following methods, which are called by the `SceneManager` at different points.

-   `constructor(scriptingAPI)`: Called when the script instance is created. It receives the `ScriptingAPI` object, which allows interaction with the game world.
-   `onLoad()`: Called once after the room's 3D scene and assets have been loaded. This is a good place for initialization logic.
-   `onUpdate(deltaTime)`: Called on every frame. `deltaTime` is the time in seconds since the last frame. Good for game logic that needs to run continuously.
-   `onFixedUpdate(fixedDeltaTime)`: Called on a fixed time step, independent of the frame rate. This is the recommended place for physics-related logic.
-   `onPlayerJoin(playerId)`: Called when a new player joins the room.
-   `onPlayerLeave(playerId)`: Called when a player leaves the room.
-   `destroy()`: Called when the room is being unloaded or reloaded. This is where you should perform cleanup tasks, like removing event listeners or cleaning up custom objects.

## Important Notes

- Scripts must export a class that follows the scripting API interface
- All imports (like "three", "cannon-es") will be properly resolved during build
- The public directory scripts are not used - everything runs through the build system
