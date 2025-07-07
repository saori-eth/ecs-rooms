export class ArenaLogic {
  constructor(scriptingAPI) {
    this.api = scriptingAPI;
    this.sitAnimationLoaded = false;
  }

  onLoad() {
    // Called once when the room and scene have been loaded.
    // Use this to set up initial room state, triggers, etc.

    // Register keyboard event listener for sit animation
    this.initKeyboardControls();
  }

  initKeyboardControls() {
    // Handle number key '1' to play sit animation
    this.handleSitKey = async (event) => {
      // Get the local player
      const localPlayer = this.api.getLocalPlayer();
      if (!localPlayer) {
        return;
      }

      try {
        // Load the sit animation if not already loaded
        if (!this.sitAnimationLoaded) {
          // Path to the animation in the public folder
          const animationUrl = "/rooms/assets/animations/sit.fbx";
          const loaded = await this.api.loadAnimation(
            localPlayer.entityId,
            animationUrl,
            "sit"
          );
          if (loaded) {
            this.sitAnimationLoaded = true;
          }
        }

        // Toggle sit animation
        const animation = this.api.getComponent(localPlayer.entityId, 9); // ANIMATION component
        if (animation && animation.overrideActionName === "sit") {
          // Stop sitting
          this.api.playAnimation(localPlayer.entityId, null);
          console.log("[ArenaLogic] Stopped sitting");
        } else {
          // Start sitting
          this.api.playAnimation(localPlayer.entityId, "sit", true);
          console.log("[ArenaLogic] Started sitting");
        }
      } catch (error) {
        console.error("[ArenaLogic] Error with sit animation:", error);
      }
    };

    // Register the handler for key '1'
    this.api.onKeyDown("1", this.handleSitKey);
  }

  onUpdate(deltaTime) {
    // Called every frame from the main game loop.
    // Use this for ongoing game logic, like spawning enemies.
    // console.log("Arena Logic updated!", deltaTime);
  }

  onFixedUpdate(deltaTime) {
    // Called every frame from the fixed game loop.
    // Use this for ongoing game logic, like spawning enemies.
    // console.log("Arena Logic fixed updated!", deltaTime);
  }

  onPlayerJoin(playerId) {
    // Called when a new player joins the room.
    console.log(`[ArenaLogic] Player ${playerId} joined`);
  }

  onPlayerLeave(playerId) {
    // Called when a player leaves the room.
  }

  // Clean up method - call this when the script is being destroyed
  cleanup() {
    // Remove keyboard listener
    if (this.handleSitKey) {
      this.api.removeKeyDownListener("1", this.handleSitKey);
    }

    // Stop any animation overrides when cleaning up
    const localPlayer = this.api.getLocalPlayer();
    if (localPlayer) {
      this.api.playAnimation(localPlayer.entityId, null);
    }
  }
}
