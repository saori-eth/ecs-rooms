export class ScriptingAPI {
  constructor(world, physicsWorld, loadedScene = null) {
    this.world = world;
    this.physicsWorld = physicsWorld;
    this.loadedScene = loadedScene;
  }

  // Entity and Component Access
  createEntity() {
    return this.world.createEntity();
  }

  destroyEntity(entityId) {
    this.world.destroyEntity(entityId);
  }

  addComponent(entityId, componentType, data) {
    this.world.addComponent(entityId, componentType, data);
  }

  getComponent(entityId, componentType) {
    return this.world.getComponent(entityId, componentType);
  }

  getEntitiesWithComponents(...componentTypes) {
    return this.world.getEntitiesWithComponents(...componentTypes);
  }

  // You can add more helper methods here later, for example:
  // getPlayer(playerId) { ... }
  // spawnObject(asset, position) { ... }
}