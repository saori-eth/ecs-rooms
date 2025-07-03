export const rooms = {
  "default-arena": {
    name: "Default Arena",
    sceneModel: "/environments/arena.glb",
    script: "/rooms/scripts/arena-logic.js",
    sceneTransform: {
      position: { x: 0, y: 0, z: 5 },
      rotation: { x: 0, y: 0, z: 0 }, // in radians
      scale: { x: 1, y: 1, z: 1 },
    },
    enablePhysics: true, // Set to false to disable trimesh collision
  },
};
