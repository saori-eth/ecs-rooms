import { loadAnim } from "./retarget.js";

class AnimationManager {
  constructor() {
    this.cachedClips = new Map();
  }

  async loadAndRetarget(vrm) {
    // Generate a unique key for caching based on VRM instance
    const vrmId = vrm.scene.uuid;
    
    // Check if we already have clips for this VRM
    if (this.cachedClips.has(vrmId)) {
      return this.cachedClips.get(vrmId);
    }

    // Load animations using the custom retarget function
    const [idleClip, walkingClip] = await Promise.all([
      loadAnim("/animations/idle.fbx", vrm),
      loadAnim("/animations/walk.fbx", vrm),
    ]);

    // Set clip names
    idleClip.name = "idle";
    walkingClip.name = "walking";

    const clips = {
      idle: idleClip,
      walking: walkingClip,
    };

    // Cache the clips for this VRM
    this.cachedClips.set(vrmId, clips);

    return clips;
  }
}

export const animationManager = new AnimationManager();
