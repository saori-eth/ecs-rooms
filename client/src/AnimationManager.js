import { loadAnim } from "./retarget.js";

export class AnimationManager {
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
    const [
      idleClip, 
      walkingClip, 
      jumpClip, 
      sprintClip,
      backwardsWalkClip,
      backwardsSprintClip,
      leftWalkClip,
      leftSprintClip,
      rightWalkClip,
      rightSprintClip
    ] = await Promise.all([
      loadAnim("/animations/idle.fbx", vrm),
      loadAnim("/animations/walk.fbx", vrm),
      loadAnim("/animations/jump.fbx", vrm),
      loadAnim("/animations/sprint.fbx", vrm),
      loadAnim("/animations/backwards_walk.fbx", vrm),
      loadAnim("/animations/backwards_sprint.fbx", vrm),
      loadAnim("/animations/left_walk.fbx", vrm),
      loadAnim("/animations/left_sprint.fbx", vrm),
      loadAnim("/animations/right_walk.fbx", vrm),
      loadAnim("/animations/right_sprint.fbx", vrm),
    ]);

    // Set clip names
    idleClip.name = "idle";
    walkingClip.name = "walking";
    jumpClip.name = "jump";
    sprintClip.name = "sprint";
    backwardsWalkClip.name = "backwards_walk";
    backwardsSprintClip.name = "backwards_sprint";
    leftWalkClip.name = "left_walk";
    leftSprintClip.name = "left_sprint";
    rightWalkClip.name = "right_walk";
    rightSprintClip.name = "right_sprint";

    const clips = {
      idle: idleClip,
      walking: walkingClip,
      jump: jumpClip,
      sprint: sprintClip,
      backwards_walk: backwardsWalkClip,
      backwards_sprint: backwardsSprintClip,
      left_walk: leftWalkClip,
      left_sprint: leftSprintClip,
      right_walk: rightWalkClip,
      right_sprint: rightSprintClip,
    };

    // Cache the clips for this VRM
    this.cachedClips.set(vrmId, clips);

    return clips;
  }

  dispose() {
    this.cachedClips.clear();
  }
}
