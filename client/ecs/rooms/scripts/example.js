export class Example {
    constructor(scriptingAPI) {
      this.api = scriptingAPI;
    }
  
    onLoad() {
      // Called once when the room and scene have been loaded.
    }
  
    onUpdate(deltaTime) {
        // called every frame
    }

    onFixedUpdate(fixedDeltaTime) {
        // called every physics update
    }

    onPlayerJoin(playerId) {
        // called when a player joins the room
    }

    onPlayerLeave(playerId) {
        // called when a player leaves the room
    }

    destroy() {
        // called when the room is being unloaded or reloaded
    }
    
    
  }
  