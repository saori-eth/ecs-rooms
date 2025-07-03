import { ComponentTypes } from '../components.js'

export function createInterpolationSystem() {
  return {
    update(world, deltaTime) {
      const entities = world.getEntitiesWithComponents(
        ComponentTypes.POSITION,
        ComponentTypes.INTERPOLATION,
        ComponentTypes.PLAYER,
        ComponentTypes.PHYSICS_BODY
      )

      entities.forEach(entityId => {
        const position = world.getComponent(entityId, ComponentTypes.POSITION)
        const interpolation = world.getComponent(entityId, ComponentTypes.INTERPOLATION)
        const player = world.getComponent(entityId, ComponentTypes.PLAYER)
        const physicsComponent = world.getComponent(entityId, ComponentTypes.PHYSICS_BODY)
        
        if (!player.isLocal && interpolation.positionBuffer.length > 0) {
          const now = Date.now()
          const renderDelay = 100
          const renderTime = now - renderDelay
          
          while (interpolation.positionBuffer.length > 2 && 
                 interpolation.positionBuffer[1].timestamp <= renderTime) {
            interpolation.positionBuffer.shift()
          }
          
          if (interpolation.positionBuffer.length >= 2 &&
              interpolation.positionBuffer[0].timestamp <= renderTime &&
              renderTime <= interpolation.positionBuffer[1].timestamp) {
            
            const t0 = interpolation.positionBuffer[0].timestamp
            const t1 = interpolation.positionBuffer[1].timestamp
            const p0 = interpolation.positionBuffer[0].position
            const p1 = interpolation.positionBuffer[1].position
            
            const alpha = (renderTime - t0) / (t1 - t0)
            
            const newX = p0.x + (p1.x - p0.x) * alpha
            const newY = p0.y + (p1.y - p0.y) * alpha
            const newZ = p0.z + (p1.z - p0.z) * alpha
            
            if (physicsComponent.body) {
              physicsComponent.body.position.set(newX, newY, newZ)
            }
          } else if (interpolation.positionBuffer.length === 1) {
            const target = interpolation.positionBuffer[0].position
            const speed = 0.1
            
            if (physicsComponent.body) {
              const currentPos = physicsComponent.body.position
              physicsComponent.body.position.set(
                currentPos.x + (target.x - currentPos.x) * speed,
                currentPos.y + (target.y - currentPos.y) * speed,
                currentPos.z + (target.z - currentPos.z) * speed
              )
            }
          }
        }
      })
    }
  }
}