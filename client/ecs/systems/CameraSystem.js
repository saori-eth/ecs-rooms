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

    // Target height offset (fallback when head bone not available)
    this.targetHeightOffset = 1.2;

    // Smoothing
    this.smoothingRate = 12; // Framerate-independent smoothing rate
    this.currentYaw = 0;
    this.currentPitch = 0.2;
    this.smoothingThreshold = 0.0001; // Stop smoothing when difference is negligible

    // Euler and vector helpers
    this.euler = new THREE.Euler(0, 0, 0, "YXZ");
    this.spherical = new THREE.Spherical();

    // Reusable THREE objects to avoid allocations in game loop
    this.cameraOffset = new THREE.Vector3();
    this.targetPosition = new THREE.Vector3();
    this.headWorldPos = new THREE.Vector3();
    this.desiredPosition = new THREE.Vector3();
    this.cameraDirection = new THREE.Vector3();
    this.pullbackVector = new THREE.Vector3();
    this.finalCameraPosition = new THREE.Vector3();
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

        // Store camera yaw for movement system
        this.currentYaw = this.yaw;
        ecsAPI.cameraYaw = this.currentYaw;
      }
    }
  }
}
