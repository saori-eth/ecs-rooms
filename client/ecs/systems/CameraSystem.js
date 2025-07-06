import * as THREE from "three";
import { ComponentTypes } from "../components.js";

export class CameraSystem {
  constructor() {
    this.offset = new THREE.Vector3(0, 2.5, 2.5);
    this.raycaster = new THREE.Raycaster();
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
        // Calculate desired camera position
        const desiredPosition = new THREE.Vector3(
          position.x + this.offset.x,
          position.y + this.offset.y,
          position.z + this.offset.z
        );

        // Set up ray from player to desired camera position
        const playerPosition = new THREE.Vector3(position.x, position.y, position.z);
        const direction = new THREE.Vector3().subVectors(desiredPosition, playerPosition).normalize();
        const distance = playerPosition.distanceTo(desiredPosition);

        this.raycaster.set(playerPosition, direction);
        this.raycaster.far = distance;

        // Get all collidable objects
        const collidableEntities = ecsAPI.getEntitiesWithComponents(
          ComponentTypes.COLLIDABLE,
          ComponentTypes.MESH
        );

        const collidableObjects = [];
        collidableEntities.forEach(entityId => {
          const meshComponent = ecsAPI.getComponent(entityId, ComponentTypes.MESH);
          if (meshComponent && meshComponent.mesh) {
            collidableObjects.push(meshComponent.mesh);
          }
        });

        // Perform raycast
        const intersections = this.raycaster.intersectObjects(collidableObjects, true);

        let finalCameraPosition;
        if (intersections.length > 0) {
          // Camera hits something - place it at the intersection point
          // Pull back slightly to avoid clipping into the object
          const closestIntersection = intersections[0];
          const pullbackDistance = 0.1; // Small distance to prevent clipping
          finalCameraPosition = closestIntersection.point.clone().sub(
            direction.clone().multiplyScalar(pullbackDistance)
          );
        } else {
          // No collision - use the desired position
          finalCameraPosition = desiredPosition;
        }

        // Set camera position and look at target
        camera.position.copy(finalCameraPosition);
        camera.lookAt(position.x, position.y, position.z);
      }
    }
  }
}
