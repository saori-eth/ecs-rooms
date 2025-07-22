export class ArenaLogic {
  constructor(scriptingAPI) {
    this.api = scriptingAPI;
  }

  onLoad() {
    // Called once when the room and scene have been loaded.
    console.log("ArenaLogic onLoad");
  }

  // Clean up method - call this when the script is being destroyed
  cleanup() {
    // Remove keyboard listener
  }
}
