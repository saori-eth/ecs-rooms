export const ComponentTypes = {
  POSITION: 'position',
  VELOCITY: 'velocity',
  INPUT: 'input',
  MESH: 'mesh',
  PLAYER: 'player',
  NETWORK: 'network',
  INTERPOLATION: 'interpolation',
  PHYSICS_BODY: 'physicsBody'
}

export function createPositionComponent(x = 0, y = 0, z = 0) {
  return { x, y, z }
}

export function createVelocityComponent(x = 0, y = 0, z = 0) {
  return { x, y, z }
}

export function createInputComponent() {
  return {
    keys: {
      w: false,
      a: false,
      s: false,
      d: false
    }
  }
}

export function createMeshComponent(mesh) {
  return { mesh }
}

export function createPlayerComponent(isLocal = false) {
  return { isLocal, speed: 5 }
}

export function createNetworkComponent(id) {
  return { id, lastUpdate: Date.now() }
}

export function createInterpolationComponent() {
  return {
    from: { x: 0, y: 0, z: 0 },
    to: { x: 0, y: 0, z: 0 },
    startTime: 0,
    duration: 100,
    positionBuffer: []
  }
}

export function createPhysicsBodyComponent(body) {
  return { body }
}