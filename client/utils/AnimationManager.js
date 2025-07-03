import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { retargetAnimation } from "vrm-mixamo-retarget";

class AnimationManager {
  constructor() {
    this.fbxLoader = new FBXLoader();
    this.cachedFbx = new Map();
  }

  async #loadFbx(url) {
    if (this.cachedFbx.has(url)) {
      return this.cachedFbx.get(url).clone();
    }
    const fbxAsset = await this.fbxLoader.loadAsync(url);
    this.cachedFbx.set(url, fbxAsset);
    return fbxAsset.clone();
  }

  async loadAndRetarget(vrm) {
    const [idleFbx, walkingFbx] = await Promise.all([
      this.#loadFbx("/animations/idle.fbx"),
      this.#loadFbx("/animations/walk.fbx"),
    ]);

    const idleClip = retargetAnimation(idleFbx, vrm);
    idleClip.name = "idle";

    const walkingClip = retargetAnimation(walkingFbx, vrm);
    walkingClip.name = "walk";

    return {
      idle: idleClip,
      walking: walkingClip,
    };
  }
}

export const animationManager = new AnimationManager();
