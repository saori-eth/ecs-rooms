// Script loading utilities

// Dynamically discover all scripts in the rooms/scripts directory using Vite's glob import
const scriptModules = import.meta.glob('./rooms/scripts/*.js');

console.log('[ScriptLoader] Available script modules:', Object.keys(scriptModules));

// Configure HMR to handle script updates without page reload
if (import.meta.hot) {
  // We accept updates to this module so it can hot-reload.
  // This is necessary for the HMR logic inside loadGameScript to be updated.
  import.meta.hot.accept(() => {
    console.log('[ScriptLoader] ScriptLoader module itself has been updated.');
  });
}

export async function loadGameScript(scriptPath, forceReload = false) {
  try {
    // Extract the script name from the path
    const scriptName = scriptPath.split("/").pop().replace(".js", "");
    console.log(`[ScriptLoader] Loading script: ${scriptName} from path: ${scriptPath}, forceReload: ${forceReload}`);

    // Construct the key that matches the glob pattern
    const moduleKey = `./rooms/scripts/${scriptName}.js`;
    console.log(`[ScriptLoader] Looking for module key: ${moduleKey}`);

    if (scriptModules[moduleKey]) {
      console.log(`[ScriptLoader] Found module, preparing to load...`);

      const importer = scriptModules[moduleKey];

      // In development, we wrap the importer to add HMR handling.
      if (import.meta.env.DEV) {
        // The wrapped function becomes the new way to get the module.
        const module = await importer();
        
        if (import.meta.hot) {
            // Accept HMR updates for the specific module that was just imported.
            import.meta.hot.accept(moduleKey, () => {
                console.log(`[ScriptLoader] HMR update accepted for ${moduleKey}. Use UI to reload.`);
            });
        }
        
        // For a forced reload, we need to bypass the cache.
        if (forceReload) {
          try {
            const timestamp = Date.now();
            const importPath = `./rooms/scripts/${scriptName}.js?update=${timestamp}`;
            console.log(`[ScriptLoader] Force reloading via: ${importPath}`);
            return await import(/* @vite-ignore */ importPath);
          } catch (e) {
            console.error(`[ScriptLoader] Force reload failed:`, e);
          }
        }
        
        return module;
      }
      
      // In production or when HMR is not supported, just load the module.
      const module = await importer();
      console.log(`[ScriptLoader] Module loaded successfully:`, module);
      return module;
    }

    throw new Error(`Script '${scriptName}' not found in registry`);
  } catch (error) {
    console.error(`[ScriptLoader] Failed to load script: ${scriptPath}`, error);
    throw error;
  }
}
