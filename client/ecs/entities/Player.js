import * as THREE from "three";
import * as CANNON from "cannon-es";
import {
  ComponentTypes,
  createPositionComponent,
  createVelocityComponent,
  createInputComponent,
  createMeshComponent,
  createPlayerComponent,
  createNetworkComponent,
  createPhysicsBodyComponent,
  createVRMComponent,
  createAnimationComponent,
  createCameraTargetComponent,
} from "../components.js";
import { createNameplateSprite } from "../../src/NameplateGenerator.js";
import { availableAvatars } from "../../src/VRMLoader.js";
import { CapsuleCollider } from "../colliders/CapsuleCollider.js";

export async function createPlayer(
  ecsAPI,
  position = { x: 0, y: 0.5, z: 0 },
  isLocal = true,
  physicsWorld = null,
  identity = null,
  vrmManager = null,
  animationManager = null,
  scene = null
) {
  const entityId = ecsAPI.createEntity();

  // Create a container group for the player
  const playerGroup = new THREE.Group();
  playerGroup.position.set(position.x, position.y, position.z);

  if (scene) scene.add(playerGroup);

  // Load VRM model
  const avatarId = identity?.avatarId || availableAvatars[0].id;
  if (!vrmManager) {
    throw new Error("VRMManager is required to create a player");
  }
  const vrm = await vrmManager.loadVRM(avatarId);

  // Reset to T-pose before applying any transforms or animations
  if (vrm.humanoid) {
    vrm.humanoid.resetPose();
  }

  // Scale and position the VRM model to fit in a roughly 1x1x1 box
  vrm.scene.scale.set(0.7, 0.7, 0.7);
  vrm.scene.position.y = -0.5; // Adjust so feet are at the bottom

  playerGroup.add(vrm.scene);
  // Add name tag
  // if (identity?.name) {
  //   // Calculate VRM height based on scale
  //   const vrmHeight = 1.0 * 0.7; // VRM is scaled to 0.7
  //   const nameplate = createNameplateSprite(identity.name, vrmHeight);
  //   playerGroup.add(nameplate);
  // }

  ecsAPI.addComponent(
    entityId,
    ComponentTypes.POSITION,
    createPositionComponent(position.x, position.y, position.z)
  );
  ecsAPI.addComponent(
    entityId,
    ComponentTypes.VELOCITY,
    createVelocityComponent()
  );
  ecsAPI.addComponent(entityId, ComponentTypes.INPUT, createInputComponent());
  ecsAPI.addComponent(
    entityId,
    ComponentTypes.MESH,
    createMeshComponent(playerGroup)
  );
  ecsAPI.addComponent(
    entityId,
    ComponentTypes.PLAYER,
    createPlayerComponent(isLocal)
  );
  ecsAPI.addComponent(entityId, ComponentTypes.VRM, createVRMComponent(vrm));

  // Add camera target and local player tag for local player
  if (isLocal) {
    ecsAPI.addComponent(
      entityId,
      ComponentTypes.CAMERA_TARGET,
      createCameraTargetComponent()
    );

    // Tag as local player for animation system detection
    ecsAPI.addComponent(entityId, "localPlayer", { isLocal: true });
  }

  // Load animations
  try {
    if (!animationManager) {
      throw new Error("AnimationManager is required to create a player");
    }
    const clips = await animationManager.loadAndRetarget(vrm);
    const mixer = new THREE.AnimationMixer(vrm.scene);
    const actions = {
      idle: mixer.clipAction(clips.idle),
      walking: mixer.clipAction(clips.walking),
      jump: mixer.clipAction(clips.jump),
      sprint: mixer.clipAction(clips.sprint),
      backwards_walk: mixer.clipAction(clips.backwards_walk),
      backwards_sprint: mixer.clipAction(clips.backwards_sprint),
      left_walk: mixer.clipAction(clips.left_walk),
      left_sprint: mixer.clipAction(clips.left_sprint),
      right_walk: mixer.clipAction(clips.right_walk),
      right_sprint: mixer.clipAction(clips.right_sprint),
    };

    // Ensure animations don't accumulate transforms
    actions.idle.setLoop(THREE.LoopRepeat);
    actions.walking.setLoop(THREE.LoopRepeat);
    actions.jump.setLoop(THREE.LoopOnce); // Jump plays once
    actions.sprint.setLoop(THREE.LoopRepeat);
    actions.backwards_walk.setLoop(THREE.LoopRepeat);
    actions.backwards_sprint.setLoop(THREE.LoopRepeat);
    actions.left_walk.setLoop(THREE.LoopRepeat);
    actions.left_sprint.setLoop(THREE.LoopRepeat);
    actions.right_walk.setLoop(THREE.LoopRepeat);
    actions.right_sprint.setLoop(THREE.LoopRepeat);

    // Reset any accumulated transforms
    actions.idle.reset();
    actions.walking.reset();
    actions.jump.reset();
    actions.sprint.reset();
    actions.backwards_walk.reset();
    actions.backwards_sprint.reset();
    actions.left_walk.reset();
    actions.left_sprint.reset();
    actions.right_walk.reset();
    actions.right_sprint.reset();

    // Start with idle animation
    actions.idle.play();

    ecsAPI.addComponent(
      entityId,
      ComponentTypes.ANIMATION,
      createAnimationComponent({
        mixer,
        clips,
        actions,
        currentAction: actions.idle,
      })
    );
  } catch (error) {
    console.error("Failed to load animations for player:", error);
  }

  if (physicsWorld) {
    // Create capsule collider
    const capsuleCollider = new CapsuleCollider(0.3, 1.0);
    const body = capsuleCollider.createBody(position, 1, isLocal);

    physicsWorld.addBody(body);
    ecsAPI.addComponent(
      entityId,
      ComponentTypes.PHYSICS_BODY,
      createPhysicsBodyComponent(body)
    );
  }

  if (!isLocal) {
    ecsAPI.addComponent(
      entityId,
      ComponentTypes.NETWORK,
      createNetworkComponent(entityId)
    );
  }

  return entityId;
}
