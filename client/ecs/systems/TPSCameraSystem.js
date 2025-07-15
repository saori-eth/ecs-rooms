import * as THREE from "three";
import { ComponentTypes } from "../components.js";

export class TPSCameraSystem {
  raycaster = new THREE.Raycaster();
  
  // UI preferences
  showReticle = true; // TPS camera needs a reticle for aiming

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
  pitchSensitivity = 0.0015;
  zoomSensitivity = 0.001;
  rightOffset = 0.6;
  heightOffset = 0.1;

  currentYaw = 0;

  // Smoothed values
  smoothedYaw = 0;
  smoothedPitch = 0;
  smoothedDistance = 4;

  // Smoothing factors (0-1, higher = more responsive)
  yawSmoothingFactor = 0.25;
  pitchSmoothingFactor = 0.25;
  zoomSmoothingFactor = 0.15;

  constructor() {
    this.camQuat = new THREE.Quaternion();
    this.targetPos = new THREE.Vector3();
    this.localOffset = new THREE.Vector3();
    this.camEuler = new THREE.Euler();
    this.mobileApplied = false;

    // Collision detection helper objects
    this.desiredPosition = new THREE.Vector3();
    this.cameraDirection = new THREE.Vector3();
    this.pullbackVector = new THREE.Vector3();
    this.finalCameraPosition = new THREE.Vector3();
    this.pullbackDistance = 0.1; // Small distance to prevent clipping
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

    if (isMobile && !this.mobileApplied) {
      this.distance = 2.5;
      this.targetDistance = 2.5;
      this.smoothedDistance = 2.5;
      this.mobileApplied = true;
    }

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

    // Apply frame-rate independent smoothing
    const smoothingDt = Math.min(dt, 0.1); // Cap dt to avoid large jumps
    
    // Calculate interpolation factors based on dt
    const yawLerpFactor = 1 - Math.pow(1 - this.yawSmoothingFactor, smoothingDt * 60);
    const pitchLerpFactor = 1 - Math.pow(1 - this.pitchSmoothingFactor, smoothingDt * 60);
    const zoomLerpFactor = 1 - Math.pow(1 - this.zoomSmoothingFactor, smoothingDt * 60);
    
    // Smooth the values
    this.smoothedYaw = THREE.MathUtils.lerp(this.smoothedYaw, this.yaw, yawLerpFactor);
    this.smoothedPitch = THREE.MathUtils.lerp(this.smoothedPitch, this.pitch, pitchLerpFactor);
    this.smoothedDistance = THREE.MathUtils.lerp(this.smoothedDistance, this.distance, zoomLerpFactor);

    // Store yaw for other systems
    this.currentYaw = this.smoothedYaw;
    ecsAPI.cameraYaw = this.currentYaw;

    // Calculate camera position
    this.targetPos.copy(position);

    if (vrmComponent?.vrm?.humanoid) {
      const head = vrmComponent.vrm.humanoid.getNormalizedBoneNode("head");
      head?.getWorldPosition(this.targetPos);
    }

    this.targetPos.y += this.heightOffset;

    this.camEuler.set(this.smoothedPitch, this.smoothedYaw, 0, "YXZ");
    this.camQuat.setFromEuler(this.camEuler);

    this.localOffset.set(this.rightOffset, 0, +this.smoothedDistance);
    this.localOffset.applyQuaternion(this.camQuat);

    this.desiredPosition.copy(this.targetPos).add(this.localOffset);

    // Set up ray from target to desired camera position for collision detection
    this.cameraDirection
      .subVectors(this.desiredPosition, this.targetPos)
      .normalize();
    const distance = this.targetPos.distanceTo(this.desiredPosition);

    this.raycaster.set(this.targetPos, this.cameraDirection);
    this.raycaster.far = distance;

    // Get all collidable objects
    const collidableEntities = ecsAPI.getEntitiesWithComponents(
      ComponentTypes.COLLIDABLE,
      ComponentTypes.MESH
    );

    const collidableObjects = [];
    collidableEntities.forEach((entityId) => {
      const meshComponent = ecsAPI.getComponent(entityId, ComponentTypes.MESH);
      if (meshComponent && meshComponent.mesh) {
        collidableObjects.push(meshComponent.mesh);
      }
    });

    // Perform raycast
    const intersections = this.raycaster.intersectObjects(
      collidableObjects,
      true
    );

    if (intersections.length > 0) {
      // Camera hits something - place it at the intersection point
      // Pull back slightly to avoid clipping into the object
      const closestIntersection = intersections[0];
      this.pullbackVector
        .copy(this.cameraDirection)
        .multiplyScalar(this.pullbackDistance);
      this.finalCameraPosition
        .copy(closestIntersection.point)
        .sub(this.pullbackVector);
      camera.position.copy(this.finalCameraPosition);
    } else {
      // No collision - use the desired position
      camera.position.copy(this.desiredPosition);
    }

    camera.quaternion.copy(this.camQuat);
  }
}
