import { ComponentTypes } from '../components.js'

export function createInputSystem() {
  const handleKeyDown = (e) => {
    const key = e.key.toLowerCase()
    inputState.keys[key] = true
  }

  const handleKeyUp = (e) => {
    const key = e.key.toLowerCase()
    inputState.keys[key] = false
  }

  const inputState = {
    keys: {}
  }

  return {
    init(world) {
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
    },

    update(world, deltaTime) {
      const entities = world.getEntitiesWithComponents(
        ComponentTypes.INPUT,
        ComponentTypes.PLAYER
      )

      entities.forEach(entityId => {
        const input = world.getComponent(entityId, ComponentTypes.INPUT)
        const player = world.getComponent(entityId, ComponentTypes.PLAYER)
        
        if (player.isLocal) {
          input.keys.w = inputState.keys.w || false
          input.keys.a = inputState.keys.a || false
          input.keys.s = inputState.keys.s || false
          input.keys.d = inputState.keys.d || false
        }
      })
    }
  }
}