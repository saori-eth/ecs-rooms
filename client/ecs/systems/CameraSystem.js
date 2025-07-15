import * as THREE from "three";
import { ComponentTypes } from "../components.js";

export class CameraSystem {
  constructor() {
    this.raycaster = new THREE.Raycaster();

    // Camera rotation state
    this.yaw = 0;
    this.pitch = 0.2; // Start with a slight downward angle
    this.distance = 4;
    this.targetDistance = 4;
    this.minDistance = 1.5;
    this.maxDistance = 8;
    this.minPitch = -Math.PI / 3; // -60 degrees
    this.maxPitch = Math.PI / 3; // 60 degrees
    this.mouseSensitivity = 0.002;
    this.zoomSensitivity = 0.001;
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
      const vrmComponent = ecsAPI.getComponent(targetId, ComponentTypes.VRM);

      if (position) {
        // Get input from InputSystem
        if (ecsAPI.inputState) {
          const { mouseDelta, wheelDelta, touchDelta, isMobile } =
            ecsAPI.inputState;

          if (isMobile) {
            // Mobile touch controls
            if (touchDelta.x !== 0 || touchDelta.y !== 0) {
              // Touch sensitivity is different from mouse
              const touchSensitivity = this.mouseSensitivity * 5;
              this.yaw -= touchDelta.x * touchSensitivity;
              this.pitch += touchDelta.y * touchSensitivity;

              // Clamp pitch to prevent camera flipping
              this.pitch = Math.max(
                this.minPitch,
                Math.min(this.maxPitch, this.pitch)
              );

              // Reset touch delta after using it
              ecsAPI.inputState.touchDelta.x = 0;
              ecsAPI.inputState.touchDelta.y = 0;
            }
          } else if (document.pointerLockElement) {
            // Desktop mouse controls
            // Update camera rotation based on mouse movement
            this.yaw -= mouseDelta.x * this.mouseSensitivity;
            this.pitch += mouseDelta.y * this.mouseSensitivity; // Changed from -= to += to fix inversion

            // Clamp pitch to prevent camera flipping
            this.pitch = Math.max(
              this.minPitch,
              Math.min(this.maxPitch, this.pitch)
            );

            // Update zoom based on wheel input
            if (wheelDelta !== 0) {
              this.targetDistance += wheelDelta * this.zoomSensitivity;
              this.targetDistance = Math.max(
                this.minDistance,
                Math.min(this.maxDistance, this.targetDistance)
              );
              ecsAPI.inputState.wheelDelta = 0;
            }

            // Reset mouse delta after using it
            ecsAPI.inputState.mouseDelta.x = 0;
            ecsAPI.inputState.mouseDelta.y = 0;
          }
        }

        // Get get transforms of player
        if (vrmComponent && vrmComponent.vrm && vrmComponent.vrm.humanoid) {
          // world position = vrmComponent.vrm.scene.getWorldPosition(vec3)
          // local position = vrmComponent.vrm.scene.position
          // world quaternion = vrmComponent.vrm.scene.getWorldQuaternion(quat)
          // local quaternion = vrmComponent.vrm.scene.quaternion
          // head bone = vrmComponent.vrm.humanoid.getNormalizedBoneNode("head")
        }

        // Store camera yaw for movement system
        this.currentYaw = this.yaw;
        ecsAPI.cameraYaw = this.currentYaw;
      }
    }
  }
}
