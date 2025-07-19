import * as THREE from "three";
import { ComponentTypes } from "../components.js";

export class FPSCameraSystem {
  // Camera rotation state
  yaw = 0;
  pitch = 0;
  minPitch = -Math.PI / 2 + 0.01; // Almost -90°
  maxPitch = Math.PI / 2 - 0.01; // Almost 90°
  mouseSensitivity = 0.002;
  pitchSensitivity = 0.0015;
  heightOffset = 0.1;

  // Smoothed values
  smoothedYaw = 0;
  smoothedPitch = 0;

  // Smoothing factors (0-1, higher = more responsive)
  yawSmoothingFactor = 0.25;
  pitchSmoothingFactor = 0.25;

  constructor() {
    this.camQuat = new THREE.Quaternion();
    this.targetPos = new THREE.Vector3();
    this.camEuler = new THREE.Euler();
    this.init = false;
  }

  update(ecsAPI, dt, camera) {
    if (!camera) return;

    const targets = ecsAPI.getEntitiesWithComponents(
      ComponentTypes.CAMERA_TARGET,
      ComponentTypes.POSITION
    );
    if (!targets.length) return;

    const targetId = targets[0];
    const position = ecsAPI.getComponent(targetId, ComponentTypes.POSITION);
    const vrmComponent = ecsAPI.getComponent(targetId, ComponentTypes.VRM);
    if (!position) return;

    if (!this.init) {
      this.init = true;
      vrmComponent.vrm.firstPerson?.setup();
    }

    // Input handling
    const {
      mouseDelta = {},
      touchDelta = {},
      isMobile,
    } = ecsAPI.inputState ?? {};

    if (isMobile) {
      // Touch controls
      if (touchDelta.x || touchDelta.y) {
        const touchSensitivity = this.mouseSensitivity * 3;
        this.yaw -= touchDelta.x * touchSensitivity;
        this.pitch = THREE.MathUtils.clamp(
          this.pitch -
            touchDelta.y *
              touchSensitivity *
              (this.pitchSensitivity / this.mouseSensitivity),
          this.minPitch,
          this.maxPitch
        );

        // Reset touch delta
        touchDelta.x = 0;
        touchDelta.y = 0;
      }
    } else if (document.pointerLockElement) {
      // Mouse controls
      this.yaw -= (mouseDelta.x ?? 0) * this.mouseSensitivity;
      this.pitch = THREE.MathUtils.clamp(
        this.pitch - (mouseDelta.y ?? 0) * this.pitchSensitivity,
        this.minPitch,
        this.maxPitch
      );

      // Reset mouse delta
      mouseDelta.x = 0;
      mouseDelta.y = 0;
    }

    // Apply frame-rate independent smoothing
    const smoothingDt = Math.min(dt, 0.1); // Cap dt to avoid large jumps

    // Calculate interpolation factors based on dt
    const yawLerpFactor =
      1 - Math.pow(1 - this.yawSmoothingFactor, smoothingDt * 60);
    const pitchLerpFactor =
      1 - Math.pow(1 - this.pitchSmoothingFactor, smoothingDt * 60);

    // Smooth the values
    this.smoothedYaw = THREE.MathUtils.lerp(
      this.smoothedYaw,
      this.yaw,
      yawLerpFactor
    );
    this.smoothedPitch = THREE.MathUtils.lerp(
      this.smoothedPitch,
      this.pitch,
      pitchLerpFactor
    );

    // Store yaw for other systems
    ecsAPI.cameraYaw = this.smoothedYaw;

    // Calculate camera position
    this.targetPos.copy(position);

    if (vrmComponent?.vrm?.humanoid) {
      const head = vrmComponent.vrm.humanoid.getNormalizedBoneNode("head");
      head?.getWorldPosition(this.targetPos);
    }

    this.targetPos.y += this.heightOffset;

    // Set camera position directly to target
    camera.position.copy(this.targetPos);

    // Set camera rotation
    this.camEuler.set(this.smoothedPitch, this.smoothedYaw, 0, "YXZ");
    this.camQuat.setFromEuler(this.camEuler);
    camera.quaternion.copy(this.camQuat);
  }
}
