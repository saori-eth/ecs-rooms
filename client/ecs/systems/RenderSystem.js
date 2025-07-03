import { ComponentTypes } from '../components.js'

export function createRenderSystem(scene) {
  return {
    update(world, deltaTime) {
      const entities = world.getEntitiesWithComponents(
        ComponentTypes.POSITION,
        ComponentTypes.MESH
      )

      entities.forEach(entityId => {
        const position = world.getComponent(entityId, ComponentTypes.POSITION)
        const meshComponent = world.getComponent(entityId, ComponentTypes.MESH)
        
        if (meshComponent.mesh) {
          meshComponent.mesh.position.x = position.x
          meshComponent.mesh.position.y = position.y
          meshComponent.mesh.position.z = position.z
        }
      })
    }
  }
}