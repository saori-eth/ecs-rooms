// Handle HMR for this module
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('[ArenaLogic] Module updated via HMR - use Reload Script button to apply changes');
  });
}

export class ArenaLogic {
  constructor(scriptingAPI) {
    this.api = scriptingAPI;
  }

  onLoad() {
    // Called once when the room and scene have been loaded.
  }

  // Clean up method - call this when the script is being destroyed
  cleanup() {
    // Remove keyboard listener
  }
}
