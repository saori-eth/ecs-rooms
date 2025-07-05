export const ComponentTypes = {
  POSITION: 1 << 0,
  VELOCITY: 1 << 1,
  INPUT: 1 << 2,
  MESH: 1 << 3,
  PLAYER: 1 << 4,
  NETWORK: 1 << 5,
  INTERPOLATION: 1 << 6,
  PHYSICS_BODY: 1 << 7,
  VRM: 1 << 8,
  ANIMATION: 1 << 9,
  CAMERA_TARGET: 1 << 10,
};

export function createPositionComponent(x = 0, y = 0, z = 0) {
  return { x, y, z };
}

export function createVelocityComponent(x = 0, y = 0, z = 0) {
  return { x, y, z };
}

export function createInputComponent() {
  return {
    keys: {
      w: false,
      a: false,
      s: false,
      d: false,
    },
    moveVector: { x: 0, y: 0, z: 0 },
  };
}

export function createMeshComponent(mesh) {
  return { mesh };
}

export function createPlayerComponent(isLocal = false) {
  return { isLocal, speed: 5 };
}

export function createNetworkComponent(id) {
  return { id, lastUpdate: Date.now() };
}

export function createInterpolationComponent() {
  return {
    from: { x: 0, y: 0, z: 0 },
    to: { x: 0, y: 0, z: 0 },
    startTime: 0,
    duration: 100,
    positionBuffer: [],
    rotationBuffer: [],
  };
}

export function createPhysicsBodyComponent(body) {
  return { body };
}

export function createVRMComponent(vrm) {
  return { vrm };
}

export function createAnimationComponent(data) {
  return {
    mixer: data.mixer,
    clips: data.clips,
    actions: data.actions,
    currentAction: data.currentAction,
  };
}

export function createCameraTargetComponent() {
  return {};
}
