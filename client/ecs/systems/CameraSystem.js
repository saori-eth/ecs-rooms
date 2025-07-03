import * as THREE from 'three';
import { ComponentTypes } from '../components.js';

export class CameraSystem {
  constructor() {
    this.offset = new THREE.Vector3(0, 2.5, 2.5);
    this.raycaster = new THREE.Raycaster();
    this.minDistance = 0.5; // Minimum distance from obstruction
    this.smoothing = 0.1; // Camera movement smoothing factor
    this.currentDistance = 1.0; // Current distance multiplier
    this.targetDistance = 1.0; // Target distance multiplier
  }

  update(world, dt, camera) {
    if (!camera) return;

    const targets = world.getEntitiesWithComponents(ComponentTypes.CAMERA_TARGET, ComponentTypes.POSITION);
    if (targets.length > 0) {
      const targetId = targets[0];
      const position = world.getComponent(targetId, ComponentTypes.POSITION);
      
      if (position) {
        const targetPosition = new THREE.Vector3(position.x, position.y, position.z);
        
        // Calculate desired camera position
        const desiredPosition = new THREE.Vector3(
          position.x + this.offset.x,
          position.y + this.offset.y,
          position.z + this.offset.z
        );
        
        // Perform raycast from target to desired camera position
        const direction = new THREE.Vector3().subVectors(desiredPosition, targetPosition).normalize();
        const distance = targetPosition.distanceTo(desiredPosition);
        
        this.raycaster.set(targetPosition, direction);
        
        // Get scene for raycasting
        const scene = window.scene;
        if (scene) {
          // Set camera for sprite raycasting (though we'll filter them out)
          this.raycaster.camera = camera;
          
          // Get all objects except sprites and other non-solid objects
          const raycastTargets = [];
          scene.traverse((object) => {
            // Skip sprites (like nametags)
            if (object.isSprite) return;
            
            // Skip objects without geometry
            if (!object.isMesh) return;
            
            // Skip invisible objects
            if (!object.visible) return;
            
            // Add to raycast targets
            raycastTargets.push(object);
          });
          
          const intersects = this.raycaster.intersectObjects(raycastTargets, false).filter(hit => {
            // Skip the player's own mesh
            const mesh = world.getComponent(targetId, ComponentTypes.MESH);
            if (mesh && mesh.mesh) {
              // Check if hit object is part of player's hierarchy
              let parent = hit.object;
              while (parent) {
                if (parent === mesh.mesh) return false;
                parent = parent.parent;
              }
            }
            
            // Skip transparent or non-solid objects
            if (hit.object.material && hit.object.material.transparent) {
              return false;
            }
            
            // Skip trigger volumes or non-physical objects
            if (hit.object.userData && hit.object.userData.trigger) {
              return false;
            }
            
            return true;
          });
          
          // Determine target distance multiplier based on obstructions
          if (intersects.length > 0 && intersects[0].distance < distance) {
            // Something is between camera and player
            const hitDistance = intersects[0].distance - this.minDistance;
            this.targetDistance = Math.max(0.1, hitDistance / distance);
          } else {
            // No obstruction, use full distance
            this.targetDistance = 1.0;
          }
          
          // Smooth the distance transition
          this.currentDistance += (this.targetDistance - this.currentDistance) * this.smoothing;
          
          // Apply the distance multiplier
          const actualOffset = this.offset.clone().multiplyScalar(this.currentDistance);
          camera.position.x = position.x + actualOffset.x;
          camera.position.y = position.y + actualOffset.y;
          camera.position.z = position.z + actualOffset.z;
          camera.lookAt(position.x, position.y, position.z);
        }
      }
    }
  }
}