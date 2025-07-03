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
} from "../ecs/components.js";
import { vrmManager } from "../utils/VRMLoader.js";

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
  const avatarId = identity?.avatarId || "BitcoinGuy";
  const vrm = await vrmManager.loadVRM(avatarId);

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

  if (physicsWorld) {
    const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const body = new CANNON.Body({
      mass: isLocal ? 1 : 0,
      shape: shape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      linearDamping: 0.4,
      angularDamping: 0.99,
    });

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
