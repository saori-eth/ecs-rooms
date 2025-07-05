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
} from "../ecs/components.js";
import { createNameplateSprite } from "../utils/NameplateGenerator.js";

export async function createPlayer(
  world,
  position = { x: 0, y: 0.5, z: 0 },
  isLocal = true,
  physicsWorld = null,
  identity = null,
  vrmManager = null,
  animationManager = null
) {
  const entityId = world.createEntity();

  // Create a container group for the player
  const playerGroup = new THREE.Group();
  playerGroup.position.set(position.x, position.y, position.z);

  const scene = window.scene;
  if (scene) scene.add(playerGroup);

  // Load VRM model
  const avatarId = identity?.avatarId || "killua";
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
  if (identity?.name) {
    // Calculate VRM height based on scale
    const vrmHeight = 1.0 * 0.7; // VRM is scaled to 0.7
    const nameplate = createNameplateSprite(identity.name, vrmHeight);
    playerGroup.add(nameplate);
  }

  world.addComponent(
    entityId,
    ComponentTypes.POSITION,
    createPositionComponent(position.x, position.y, position.z)
  );
  world.addComponent(
    entityId,
    ComponentTypes.VELOCITY,
    createVelocityComponent()
  );
  world.addComponent(entityId, ComponentTypes.INPUT, createInputComponent());
  world.addComponent(
    entityId,
    ComponentTypes.MESH,
    createMeshComponent(playerGroup)
  );
  world.addComponent(
    entityId,
    ComponentTypes.PLAYER,
    createPlayerComponent(isLocal)
  );
  world.addComponent(entityId, ComponentTypes.VRM, createVRMComponent(vrm));

  // Add camera target and local player tag for local player
  if (isLocal) {
    world.addComponent(
      entityId,
      ComponentTypes.CAMERA_TARGET,
      createCameraTargetComponent()
    );

    // Tag as local player for animation system detection
    world.addComponent(entityId, "localPlayer", { isLocal: true });
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
    };

    // Ensure animations don't accumulate transforms
    actions.idle.setLoop(THREE.LoopRepeat);
    actions.walking.setLoop(THREE.LoopRepeat);

    // Reset any accumulated transforms
    actions.idle.reset();
    actions.walking.reset();

    // Start with idle animation
    actions.idle.play();

    world.addComponent(
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
    // Create capsule-like compound shape using spheres
    const body = new CANNON.Body({
      mass: isLocal ? 1 : 0,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      linearDamping: 0.9,
      angularDamping: 0.999,
      fixedRotation: true, // Prevent capsule from tipping over
    });

    // Capsule parameters
    const radius = 0.3;
    const height = 1.0; // Height between top and bottom sphere centers
    const sphereShape = new CANNON.Sphere(radius);

    // Create material with low friction to reduce bouncing
    const playerMaterial = new CANNON.Material("playerMaterial");
    playerMaterial.friction = 0.1;
    playerMaterial.restitution = 0.0; // No bouncing
    body.material = playerMaterial;

    // Add spheres to create capsule shape
    // Bottom sphere
    body.addShape(sphereShape, new CANNON.Vec3(0, -height / 2, 0));
    // Middle sphere
    body.addShape(sphereShape, new CANNON.Vec3(0, 0, 0));
    // Top sphere
    body.addShape(sphereShape, new CANNON.Vec3(0, height / 2, 0));

    physicsWorld.addBody(body);
    world.addComponent(
      entityId,
      ComponentTypes.PHYSICS_BODY,
      createPhysicsBodyComponent(body)
    );
  }

  if (!isLocal) {
    world.addComponent(
      entityId,
      ComponentTypes.NETWORK,
      createNetworkComponent(entityId)
    );
  }

  return entityId;
}
