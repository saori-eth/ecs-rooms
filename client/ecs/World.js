export class World {
  constructor() {
    this.entities = new Map()
    this.components = new Map()
    this.systems = []
    this.nextEntityId = 1
  }

  createEntity() {
    const id = this.nextEntityId++
    this.entities.set(id, new Set())
    return id
  }

  destroyEntity(entityId) {
    const componentTypes = this.entities.get(entityId)
    if (componentTypes) {
      componentTypes.forEach(type => {
        const storage = this.components.get(type)
        if (storage) {
          storage.delete(entityId)
        }
      })
      this.entities.delete(entityId)
    }
  }

  addComponent(entityId, componentType, data) {
    if (!this.entities.has(entityId)) {
      throw new Error(`Entity ${entityId} does not exist`)
    }

    if (!this.components.has(componentType)) {
      this.components.set(componentType, new Map())
    }

    this.components.get(componentType).set(entityId, data)
    this.entities.get(entityId).add(componentType)
  }

  removeComponent(entityId, componentType) {
    const storage = this.components.get(componentType)
    if (storage) {
      storage.delete(entityId)
    }

    const entity = this.entities.get(entityId)
    if (entity) {
      entity.delete(componentType)
    }
  }

  getComponent(entityId, componentType) {
    const storage = this.components.get(componentType)
    return storage ? storage.get(entityId) : null
  }

  hasComponent(entityId, componentType) {
    const entity = this.entities.get(entityId)
    return entity ? entity.has(componentType) : false
  }

  getEntitiesWithComponents(...componentTypes) {
    const result = []
    
    for (const [entityId, entityComponents] of this.entities) {
      if (componentTypes.every(type => entityComponents.has(type))) {
        result.push(entityId)
      }
    }
    
    return result
  }

  registerSystem(system) {
    this.systems.push(system)
    if (system.init) {
      system.init(this)
    }
  }

  addSystem(system) {
    return this.registerSystem(system)
  }

  update(deltaTime, ...args) {
    for (const system of this.systems) {
      system.update(this, deltaTime, ...args)
    }
  }

  findEntityWithComponent(componentType) {
    for (const [entityId, entityComponents] of this.entities) {
      if (entityComponents.has(componentType)) {
        return { id: entityId }
      }
    }
    return null
  }
}