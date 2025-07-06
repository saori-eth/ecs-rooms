import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";

export const availableAvatars = [
  {
    id: "killua",
    name: "Killua",
    path: "/avatars/killua.vrm",
  },
  {
    id: "asuka",
    name: "Asuka",
    path: "/avatars/asuka.vrm",
  },
  {
    id: "kagura",
    name: "Kagura",
    path: "/avatars/kagura.vrm",
  },
  {
    id: "luffy",
    name: "Luffy",
    path: "/avatars/luffy.vrm",
  },
  {
    id: "yuji_itadori",
    name: "Yuji Itadori",
    path: "/avatars/yuji_itadori.vrm",
  },
  {
    id: "lain",
    name: "Lain",
    path: "/avatars/lain.vrm",
  },
];

export class VRMManager {
  constructor() {
    this.loader = new GLTFLoader();
    this.loader.register((parser) => new VRMLoaderPlugin(parser));
    this.availableAvatars = availableAvatars;
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
          //...
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

  dispose() {
    // GLTFLoader doesn't need explicit disposal
    // It doesn't hold references to loaded resources
  }
}
