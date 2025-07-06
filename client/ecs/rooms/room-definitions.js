export const rooms = {
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
  midship: {
    name: "Midship",
    sceneModel: "/environments/midship.glb",
    script: "/rooms/scripts/arena-logic.js",
    sceneTransform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
  },
  "particle-box": {
    name: "Particle Box",
    sceneModel: "/environments/arena.glb", // Using arena as the box environment
    script: "/rooms/scripts/particle-box-scene.js",
    sceneTransform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
  },
};
