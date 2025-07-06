// Script loading utilities
export async function loadGameScript(scriptPath) {
  try {
    // Extract the script name from the path
    const scriptName = scriptPath.split("/").pop().replace(".js", "");

    // Map of available scripts - these are bundled with the app
    const scriptModules = {
      "arena-shooting-game": () =>
        import("./rooms/scripts/arena-shooting-game.js"),
      "arena-logic": () => import("./rooms/scripts/arena-logic.js"),
      "particle-box-scene": () => import("./rooms/scripts/particle-box-scene.js"),
    };

    if (scriptModules[scriptName]) {
      const module = await scriptModules[scriptName]();
      return module;
    }

    throw new Error(`Script '${scriptName}' not found in registry`);
  } catch (error) {
    console.error(`[ScriptLoader] Failed to load script: ${scriptPath}`, error);
    throw error;
  }
}
