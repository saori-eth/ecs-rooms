import { ComponentTypes } from '../components.js'
import * as CANNON from 'cannon-es'

export function createMovementSystem() {
  return {
    update(world, deltaTime) {
      const entities = world.getEntitiesWithComponents(
        ComponentTypes.PHYSICS_BODY,
        ComponentTypes.INPUT,
        ComponentTypes.PLAYER
      )

      entities.forEach(entityId => {
        const physicsComponent = world.getComponent(entityId, ComponentTypes.PHYSICS_BODY)
        const input = world.getComponent(entityId, ComponentTypes.INPUT)
        const player = world.getComponent(entityId, ComponentTypes.PLAYER)

        if (!player.isLocal || !physicsComponent.body) return

        const force = new CANNON.Vec3()
        const moveForce = player.speed * 10

        if (input.keys.w) force.z -= moveForce
        if (input.keys.s) force.z += moveForce
        if (input.keys.a) force.x -= moveForce
        if (input.keys.d) force.x += moveForce

        if (force.x !== 0 && force.z !== 0) {
          const factor = 0.707
          force.x *= factor
          force.z *= factor
        }

        physicsComponent.body.velocity.x = force.x / 10
        physicsComponent.body.velocity.z = force.z / 10
        
        physicsComponent.body.velocity.y = Math.max(-10, physicsComponent.body.velocity.y)
      })
    }
  }
}