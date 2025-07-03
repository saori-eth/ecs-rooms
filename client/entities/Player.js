import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { 
  ComponentTypes, 
  createPositionComponent,
  createVelocityComponent,
  createInputComponent,
  createMeshComponent,
  createPlayerComponent,
  createNetworkComponent,
  createPhysicsBodyComponent
} from '../ecs/components.js'

export function createPlayer(world, position = { x: 0, y: 0.5, z: 0 }, isLocal = true, physicsWorld = null) {
  const entityId = world.createEntity()
  
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshStandardMaterial({ 
    color: isLocal ? 0x00ff00 : 0xff0000
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.position.set(position.x, position.y, position.z)
  
  const scene = mesh.parent || window.scene
  if (scene) scene.add(mesh)
  
  world.addComponent(entityId, ComponentTypes.POSITION, createPositionComponent(position.x, position.y, position.z))
  world.addComponent(entityId, ComponentTypes.VELOCITY, createVelocityComponent())
  world.addComponent(entityId, ComponentTypes.INPUT, createInputComponent())
  world.addComponent(entityId, ComponentTypes.MESH, createMeshComponent(mesh))
  world.addComponent(entityId, ComponentTypes.PLAYER, createPlayerComponent(isLocal))
  
  if (physicsWorld) {
    const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))
    const body = new CANNON.Body({
      mass: isLocal ? 1 : 0,
      shape: shape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      linearDamping: 0.4,
      angularDamping: 0.99
    })
    
    physicsWorld.addBody(body)
    world.addComponent(entityId, ComponentTypes.PHYSICS_BODY, createPhysicsBodyComponent(body))
  }
  
  if (!isLocal) {
    world.addComponent(entityId, ComponentTypes.NETWORK, createNetworkComponent(entityId))
  }
  
  return entityId
}