import * as CANNON from 'cannon-es'
import { ComponentTypes } from '../components.js'

export function createPhysicsSystem() {
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0)
  })
  world.broadphase = new CANNON.NaiveBroadphase()
  world.solver.iterations = 10
  
  // Ground removed - using scene collision instead
  // Player material is created in SceneManager for scene collision
  
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