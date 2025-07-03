# Room Scripts

This directory contains all room scripts that are loaded dynamically by the game.

## How It Works

Scripts are imported through the ScriptLoader.js module, which maintains a registry of available scripts. This approach allows:

1. Proper module resolution (importing npm packages like "three")
2. Build-time optimization and bundling
3. Type checking and linting
4. Tree shaking of unused code

## Adding New Scripts

1. Create your script file in this directory
2. Add an entry to the `scriptModules` object in `/client/src/ScriptLoader.js`:
   ```javascript
   'your-script-name': () => import('./rooms/scripts/your-script-name.js'),
   ```
3. Reference it in `room-definitions.js` using: `/rooms/scripts/your-script-name.js`

## Important Notes

- Scripts must export a class that follows the scripting API interface
- All imports (like "three", "cannon-es") will be properly resolved during build
- The public directory scripts are not used - everything runs through the build system