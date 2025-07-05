export const rooms = {
  "arena-shooter": {
    name: "Arena Shooter",
    sceneModel: "/environments/arena.glb",
    script: "/rooms/scripts/arena-shooting-game.js",
    sceneTransform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 }, // in radians
      scale: { x: 1, y: 1, z: 1 },
    },
    enablePhysics: true, // Set to false to disable trimesh collision
  },
  "arena-empty": {
    name: "Empty",
    sceneModel: "/environments/arena.glb",
    script: "/rooms/scripts/arena-logic.js",
    sceneTransform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
  },
};
