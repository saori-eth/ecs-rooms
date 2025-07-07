# Animation API

## Overview
The Animation API allows scripts to load custom animations and override player animations dynamically. This enables features like emotes, special abilities, and context-sensitive animations.

## Animation Methods

### loadAnimation(entityId, animationUrl, animationName)
Loads and prepares an animation for an entity.

**Parameters:**
- `entityId` - The entity to load the animation for (must have VRM and Animation components)
- `animationUrl` - URL path to the animation file (FBX format)
- `animationName` - A unique name to identify this animation

**Returns:** `Promise<boolean>` - True if successfully loaded

```javascript
// Load a custom sit animation
const loaded = await this.api.loadAnimation(
  localPlayer.entityId, 
  '/rooms/assets/animations/sit.fbx', 
  'sit'
);
```

### playAnimation(entityId, animationName, loop = true, persistOnMove = false)
Plays an animation override on an entity.

**Parameters:**
- `entityId` - The entity to play the animation on
- `animationName` - Name of the animation to play (or null to stop override)
- `loop` - Whether the animation should loop (default: true)
- `persistOnMove` - Whether the animation continues when player moves (default: false)

**Returns:** `boolean` - True if successful

```javascript
// Play sit animation (stops when player moves)
this.api.playAnimation(localPlayer.entityId, 'sit', true);

// Play animation that continues during movement
this.api.playAnimation(localPlayer.entityId, 'dance', true, true);

// Stop animation override
this.api.playAnimation(localPlayer.entityId, null);
```

## Animation System Behavior

### Override Priority
When an override animation is active:
1. It takes precedence over movement-based animations (idle, walk, run, jump)
2. By default, moving cancels the override (unless `persistOnMove` is true)
3. Override animations are automatically synchronized across the network

### Network Synchronization
- Animation overrides are automatically sent to all players in the room
- Remote players will load missing animations on-demand
- Network messages only send animation changes (not every frame)

### Example: Emote System

```javascript
export class EmoteSystem {
  constructor(scriptingAPI) {
    this.api = scriptingAPI;
    this.emotes = {
      'sit': '/rooms/assets/animations/sit.fbx',
      'wave': '/rooms/assets/animations/wave.fbx',
      'dance': '/rooms/assets/animations/dance.fbx'
    };
    this.loadedEmotes = new Set();
  }

  async onLoad() {
    // Register keyboard shortcuts for emotes
    this.api.onKeyDown('1', () => this.playEmote('sit'));
    this.api.onKeyDown('2', () => this.playEmote('wave'));
    this.api.onKeyDown('3', () => this.playEmote('dance'));
    
    // Stop emote on ESC
    this.api.onKeyDown('escape', () => this.stopEmote());
  }

  async playEmote(emoteName) {
    const localPlayer = this.api.getLocalPlayer();
    if (!localPlayer) return;

    // Load emote if not already loaded
    if (!this.loadedEmotes.has(emoteName)) {
      const loaded = await this.api.loadAnimation(
        localPlayer.entityId,
        this.emotes[emoteName],
        emoteName
      );
      if (loaded) {
        this.loadedEmotes.add(emoteName);
      }
    }

    // Play the emote
    this.api.playAnimation(localPlayer.entityId, emoteName, true);
  }

  stopEmote() {
    const localPlayer = this.api.getLocalPlayer();
    if (localPlayer) {
      this.api.playAnimation(localPlayer.entityId, null);
    }
  }
}
```

## Best Practices

1. **Preload animations** during room initialization for better performance
2. **Use meaningful animation names** that describe the action
3. **Handle loading failures** gracefully with try/catch blocks
4. **Consider mobile players** when assigning keyboard shortcuts
5. **Test animations** with multiple players to ensure synchronization works

## Animation File Requirements

- **Format**: FBX files with Mixamo-compatible bone structure
- **Path**: Place animations in `client/public/` or subdirectories
- **Size**: Keep files under 5MB for faster loading
- **Naming**: Use descriptive names (e.g., `sit.fbx`, `wave.fbx`)