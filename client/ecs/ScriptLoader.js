// Script loading utilities

// Dynamically discover all scripts in the rooms/scripts directory using Vite's glob import
const scriptModules = import.meta.glob('./rooms/scripts/*.js');

console.log('[ScriptLoader] Available script modules:', Object.keys(scriptModules));

// Configure HMR to handle script updates without page reload
if (import.meta.hot) {
  // Accept updates for all script modules to prevent page reload
  Object.keys(scriptModules).forEach(modulePath => {
    import.meta.hot.accept(modulePath, () => {
      console.log(`[ScriptLoader] HMR update detected for ${modulePath}, but handled manually - no auto reload`);
      // Do nothing - we handle reloading manually via the UI button
    });
  });
  
  // Also accept updates for this module itself
  import.meta.hot.accept(() => {
    console.log('[ScriptLoader] ScriptLoader module updated');
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
      console.log(`[ScriptLoader] Found module, loading...`);
      
      // For force reload in development, use direct dynamic import
      if (forceReload && import.meta.env.DEV) {
        try {
          console.log(`[ScriptLoader] Force reload in dev mode - using direct import`);
          // Use relative path from this file's location
          const timestamp = Date.now();
          const importPath = `./rooms/scripts/${scriptName}.js?update=${timestamp}`;
          console.log(`[ScriptLoader] Import path: ${importPath}`);
          
          // Use dynamic import with timestamp to bypass cache
          const module = await import(/* @vite-ignore */ importPath);
          console.log(`[ScriptLoader] Module loaded with timestamp:`, module);
          return module;
        } catch (e) {
          console.log(`[ScriptLoader] Direct import failed, falling back:`, e);
        }
      }
      
      // Regular glob import
      const module = await scriptModules[moduleKey]();
      console.log(`[ScriptLoader] Module loaded successfully:`, module);
      return module;
    }

    throw new Error(`Script '${scriptName}' not found in registry`);
  } catch (error) {
    console.error(`[ScriptLoader] Failed to load script: ${scriptPath}`, error);
    throw error;
  }
}
