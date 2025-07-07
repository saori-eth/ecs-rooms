import { ComponentTypes } from "../components.js";
import GlobalEventManager from "../../src/GlobalEventManager.js";

export function createRenderSystem(scene) {
  let ecsAPIRef = null;

  const handleResize = () => {
    if (ecsAPIRef && ecsAPIRef.camera && ecsAPIRef.renderer) {
      ecsAPIRef.camera.aspect = window.innerWidth / window.innerHeight;
      ecsAPIRef.camera.updateProjectionMatrix();
      ecsAPIRef.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  };

  return {
    init(ecsAPI) {
      ecsAPIRef = ecsAPI;
      GlobalEventManager.add(window, "resize", handleResize);
    },
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

    shutdown() {
      GlobalEventManager.remove(window, "resize", handleResize);
    },
  };
}
