import { ComponentTypes } from "../components.js";

export function createRenderSystem(scene) {
  return {
    update(ecsAPI, deltaTime) {
      // First, update all VRM models
      const vrmEntities = ecsAPI.getEntitiesWithComponents(ComponentTypes.VRM);
      vrmEntities.forEach((entityId) => {
        const vrmComponent = ecsAPI.getComponent(entityId, ComponentTypes.VRM);
        if (vrmComponent && vrmComponent.vrm && vrmComponent.vrm.update) {
          vrmComponent.vrm.update(deltaTime);
        }
      });

      // Then update positions
      const entities = ecsAPI.getEntitiesWithComponents(
        ComponentTypes.POSITION,
        ComponentTypes.MESH
      );

      entities.forEach((entityId) => {
        const position = ecsAPI.getComponent(entityId, ComponentTypes.POSITION);
        const meshComponent = ecsAPI.getComponent(
          entityId,
          ComponentTypes.MESH
        );

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
      });
    },
  };
}
