// Script loading utilities for production environments
export async function loadGameScript(scriptPath) {
  try {
    // Extract script name from path
    const scriptName = scriptPath.split("/").pop().replace(".js", "");

    // Import all scripts statically for production bundling
    const scriptRegistry = {
      "arena-shooting-game": () =>
        import("./rooms/scripts/arena-shooting-game.js"),
      "arena-logic": () => import("./rooms/scripts/arena-logic.js"),
    };

    if (scriptRegistry[scriptName]) {
      return await scriptRegistry[scriptName]();
    }

    // In development, try dynamic import as fallback
    if (import.meta.env.DEV) {
      const module = await import(/* @vite-ignore */ scriptPath);
      return module;
    }

    throw new Error(`Script '${scriptName}' not found in registry`);
  } catch (error) {
    console.error("[ScriptLoader] Failed to load script:", error);
    throw error;
  }
}
