export const rooms = {
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
  midship: {
    name: "Midship",
    description: "A room with a script running",
    camera: "tps",
    sceneModel: "/environments/midship.glb",
    script: "/rooms/scripts/particle-box-scene.js",
    sceneTransform: {
      position: { x: 0, y: 5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
  },
};
