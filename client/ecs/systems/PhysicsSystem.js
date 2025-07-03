import * as CANNON from 'cannon-es'
import { ComponentTypes } from '../components.js'

export function createPhysicsSystem() {
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0)
  })
  world.broadphase = new CANNON.NaiveBroadphase()
  world.solver.iterations = 10
  
  // Create ground material
  const groundMaterial = new CANNON.Material('groundMaterial')
  groundMaterial.friction = 0.4
  groundMaterial.restitution = 0.0
  
  const groundShape = new CANNON.Box(new CANNON.Vec3(25, 0.1, 25))
  const groundBody = new CANNON.Body({
    mass: 0,
    shape: groundShape,
    position: new CANNON.Vec3(0, -0.1, 0),
    material: groundMaterial
  })
  world.addBody(groundBody)
  
  // Create contact material between player and ground
  const playerMaterial = new CANNON.Material('playerMaterial')
  const playerGroundContact = new CANNON.ContactMaterial(
    playerMaterial,
    groundMaterial,
    {
      friction: 0.1,
      restitution: 0.0,
      contactEquationStiffness: 1e8,
      contactEquationRelaxation: 3,
    }
  )
  world.addContactMaterial(playerGroundContact)
  
  const fixedTimeStep = 1 / 60
  let accumulator = 0
  
  return {
    world,
    
    update(ecsWorld, deltaTime) {
      accumulator += deltaTime
      
      while (accumulator >= fixedTimeStep) {
        world.step(fixedTimeStep)
        accumulator -= fixedTimeStep
      }
      
      const entities = ecsWorld.getEntitiesWithComponents(
        ComponentTypes.PHYSICS_BODY,
        ComponentTypes.POSITION
      )
      
      entities.forEach(entityId => {
        const physicsComponent = ecsWorld.getComponent(entityId, ComponentTypes.PHYSICS_BODY)
        const position = ecsWorld.getComponent(entityId, ComponentTypes.POSITION)
        
        if (physicsComponent.body) {
          position.x = physicsComponent.body.position.x
          position.y = physicsComponent.body.position.y
          position.z = physicsComponent.body.position.z
        }
      })
    }
  }
}