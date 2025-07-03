# Script Files Location

## Important: Production Deployment

Scripts MUST be placed in this directory (`client/public/rooms/scripts/`) for production builds to work correctly.

The dynamic import in SceneManager.js loads scripts at runtime, which means they need to be accessible as static files in production. Vite doesn't bundle dynamically imported paths that use variables or template strings.

## Development vs Production

- **Development**: Scripts can be imported from anywhere due to Vite's dev server
- **Production**: Scripts must be in the public directory to be served as static files

## Adding New Scripts

1. Create your script file in this directory
2. Reference it in room-definitions.js using the path: `/rooms/scripts/your-script.js`
3. The script will be copied to the dist folder during build

## Alternative Solutions

If you need more advanced bundling:
1. Use static imports with a script registry
2. Configure Vite to include specific dynamic imports
3. Use a build plugin to handle script bundling