export class ArenaLogic {
  constructor(scriptingAPI) {
    this.api = scriptingAPI;
  }

  onLoad() {
    // Called once when the room and scene have been loaded.
    // Use this to set up initial room state, triggers, etc.
  }

  onUpdate(deltaTime) {
    // Called every frame from the main game loop.
    // Use this for ongoing game logic, like spawning enemies.
    // console.log("Arena Logic updated!", deltaTime);
  }

  onPlayerJoin(playerId) {
    // Called when a new player joins the room.
  }

  onPlayerLeave(playerId) {
    // Called when a player leaves the room.
  }
}
