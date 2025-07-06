import * as THREE from "three";
import { ComponentTypes } from "../components.js";

export class CameraSystem {
  constructor() {
    this.offset = new THREE.Vector3(0, 2.5, 2.5);
  }

  update(ecsAPI, dt, camera) {
    if (!camera) return;

    const targets = ecsAPI.getEntitiesWithComponents(
      ComponentTypes.CAMERA_TARGET,
      ComponentTypes.POSITION
    );
    if (targets.length > 0) {
      const targetId = targets[0];
      const position = ecsAPI.getComponent(targetId, ComponentTypes.POSITION);

      if (position) {
        // Set camera position with offset
        camera.position.x = position.x + this.offset.x;
        camera.position.y = position.y + this.offset.y;
        camera.position.z = position.z + this.offset.z;
        camera.lookAt(position.x, position.y, position.z);
      }
    }
  }
}
