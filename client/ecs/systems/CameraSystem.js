import * as THREE from "three";
import { ComponentTypes } from "../components.js";

export class CameraSystem {
  raycaster = new THREE.Raycaster();

  // Camera rotation state
  yaw = 0;
  pitch = 0; // Slight downward angle
  distance = 4;
  targetDistance = 4;
  minDistance = 1.5;
  maxDistance = 8;
  minPitch = -Math.PI / 3; // -60°
  maxPitch = Math.PI / 3; // 60°
  mouseSensitivity = 0.002;
  zoomSensitivity = 0.001;
  rightOffset = 0.8;
  heightOffset = 0.2;

  currentYaw = 0;

  constructor() {
    this.camQuat = new THREE.Quaternion();
    this.targetPos = new THREE.Vector3();
    this.localOffset = new THREE.Vector3();
    this.camEuler = new THREE.Euler();
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

    // Input handling
    const {
      mouseDelta = {},
      wheelDelta = 0,
      touchDelta = {},
      isMobile,
    } = ecsAPI.inputState ?? {};

    if (isMobile) {
      // Touch controls
      if (touchDelta.x || touchDelta.y) {
        const touchSensitivity = this.mouseSensitivity * 5;
        this.yaw -= touchDelta.x * touchSensitivity;

        // Reset touch delta
        touchDelta.x = 0;
        touchDelta.y = 0;
      }
    } else if (document.pointerLockElement) {
      // Mouse controls
      this.yaw -= (mouseDelta.x ?? 0) * this.mouseSensitivity;

      if (wheelDelta) {
        this.targetDistance = THREE.MathUtils.clamp(
          this.targetDistance + wheelDelta * this.zoomSensitivity,
          this.minDistance,
          this.maxDistance
        );
        this.distance = this.targetDistance;
        ecsAPI.inputState.wheelDelta = 0;
      }

      // Reset mouse delta
      mouseDelta.x = 0;
      mouseDelta.y = 0;
    }

    // Store yaw for other systems
    this.currentYaw = this.yaw;
    ecsAPI.cameraYaw = this.currentYaw;

    // Calculate camera position
    this.targetPos.copy(position);

    if (vrmComponent?.vrm?.humanoid) {
      const head = vrmComponent.vrm.humanoid.getNormalizedBoneNode("head");
      head?.getWorldPosition(this.targetPos);
    }

    this.targetPos.y += this.heightOffset;

    this.camEuler.set(this.pitch, this.yaw, 0, "YXZ");
    this.camQuat.setFromEuler(this.camEuler);

    this.localOffset.set(this.rightOffset, 0, +this.distance);
    this.localOffset.applyQuaternion(this.camQuat);

    camera.position.copy(this.targetPos).add(this.localOffset);
    camera.quaternion.copy(this.camQuat);
  }
}
