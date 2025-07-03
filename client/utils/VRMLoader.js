import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";

class VRMManager {
  constructor() {
    this.loader = new GLTFLoader();
    this.loader.register((parser) => new VRMLoaderPlugin(parser));
    this.availableAvatars = [
      {
        id: "low-poly-girl",
        name: "Low Poly Girl",
        path: "/avatars/low-poly-girl.vrm",
      },
      { id: "glasses", name: "Glasses", path: "/avatars/glasses.vrm" },
      { id: "bonnie", name: "Bonnie", path: "/avatars/bonnie.vrm" },
      { id: "taiga", name: "Taiga", path: "/avatars/taiga.vrm" },
    ];
  }

  async loadVRM(avatarId) {
    const avatarInfo = this.availableAvatars.find((a) => a.id === avatarId);
    if (!avatarInfo) {
      throw new Error(`Avatar ${avatarId} not found`);
    }

    // Add unique timestamp to force fresh load
    const url = `${avatarInfo.path}?t=${Date.now()}`;

    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          const vrm = gltf.userData.vrm;

          // Optimize the VRM
          VRMUtils.removeUnnecessaryVertices(gltf.scene);
          VRMUtils.removeUnnecessaryJoints(gltf.scene);

          vrm.scene.traverse((obj) => {
            obj.frustumCulled = false;
            if (obj.isMesh) {
              obj.castShadow = true;
              obj.receiveShadow = true;
            }
          });

          resolve(vrm);
        },
        (progress) => {
          console.log(
            `Loading ${avatarId}: ${(
              (progress.loaded / progress.total) *
              100
            ).toFixed(0)}%`
          );
        },
        (error) => {
          console.error("Error loading VRM:", error);
          reject(error);
        }
      );
    });
  }

  getAvailableAvatars() {
    return this.availableAvatars;
  }
}

export const vrmManager = new VRMManager();
