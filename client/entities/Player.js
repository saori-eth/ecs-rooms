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
} from "../ecs/components.js";
import { vrmManager } from "../utils/VRMLoader.js";
import { animationManager } from "../utils/AnimationManager.js";

export async function createPlayer(
  world,
  position = { x: 0, y: 0.5, z: 0 },
  isLocal = true,
  physicsWorld = null,
  identity = null
) {
  const entityId = world.createEntity();

  // Create a container group for the player
  const playerGroup = new THREE.Group();
  playerGroup.position.set(position.x, position.y, position.z);

  const scene = window.scene;
  if (scene) scene.add(playerGroup);

  // Load VRM model
  const avatarId = identity?.avatarId || "low-poly-girl";
  const vrm = await vrmManager.loadVRM(avatarId);

  // Reset to T-pose before applying any transforms or animations
  if (vrm.humanoid) {
    vrm.humanoid.resetPose();
  }

  // Scale and position the VRM model to fit in a roughly 1x1x1 box
  vrm.scene.scale.set(0.7, 0.7, 0.7);
  vrm.scene.position.y = -0.5; // Adjust so feet are at the bottom

  playerGroup.add(vrm.scene);
  console.log("player group", playerGroup);

  // Add name tag
  if (identity?.name) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 64;

    context.fillStyle = "rgba(0, 0, 0, 0.5)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = "32px Arial";
    context.fillStyle = "white";
    context.textAlign = "center";
    context.fillText(identity.name, canvas.width / 2, canvas.height / 2 + 10);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 0.5, 1);
    sprite.position.set(0, 1.5, 0);
    playerGroup.add(sprite);
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

  // Load animations
  try {
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
