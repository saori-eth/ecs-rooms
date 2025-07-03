import { ComponentTypes } from "../components.js";

export function createRenderSystem(scene) {
  return {
    update(world, deltaTime) {
      const entities = world.getEntitiesWithComponents(
        ComponentTypes.POSITION,
        ComponentTypes.MESH
      );

      entities.forEach((entityId) => {
        const position = world.getComponent(entityId, ComponentTypes.POSITION);
        const meshComponent = world.getComponent(entityId, ComponentTypes.MESH);
        const vrmComponent = world.getComponent(entityId, ComponentTypes.VRM);

        if (meshComponent.mesh) {
          meshComponent.mesh.position.x = position.x;
          meshComponent.mesh.position.y = position.y;
          meshComponent.mesh.position.z = position.z;
          
          // Force update the matrix for groups
          if (meshComponent.mesh.isGroup) {
            meshComponent.mesh.updateMatrix();
            meshComponent.mesh.updateMatrixWorld(true);
          }
        }

        if (vrmComponent && vrmComponent.vrm) {
          vrmComponent.vrm.update(deltaTime);
        }
      });
    },
  };
}
