# Input API

## Overview
The Input API allows scripts to listen for keyboard events, enabling custom controls and interactions beyond the standard movement controls.

## Keyboard Event Methods

### onKeyDown(key, callback)
Registers a callback to be called when a key is pressed.

**Parameters:**
- `key` - The key to listen for (case-insensitive)
- `callback` - Function called when the key is pressed

**Returns:** `boolean` - True if successfully registered

```javascript
// Listen for 'E' key press
this.api.onKeyDown('e', (event) => {
  console.log('E key pressed!');
  this.interact();
});

// Listen for number keys
this.api.onKeyDown('1', () => this.selectItem(1));
this.api.onKeyDown('2', () => this.selectItem(2));
```

### onKeyUp(key, callback)
Registers a callback to be called when a key is released.

**Parameters:**
- `key` - The key to listen for (case-insensitive)
- `callback` - Function called when the key is released

**Returns:** `boolean` - True if successfully registered

```javascript
// Listen for key release
this.api.onKeyUp('shift', (event) => {
  console.log('Shift released - stop sprinting');
  this.stopSprint();
});
```

### removeKeyDownListener(key, callback)
Removes a previously registered keydown listener.

**Parameters:**
- `key` - The key the listener was registered for
- `callback` - The exact callback function that was registered

**Returns:** `boolean` - True if successfully removed

```javascript
// Store reference to callback
this.interactHandler = (event) => this.interact();

// Register listener
this.api.onKeyDown('e', this.interactHandler);

// Later, remove it
this.api.removeKeyDownListener('e', this.interactHandler);
```

### removeKeyUpListener(key, callback)
Removes a previously registered keyup listener.

**Parameters:**
- `key` - The key the listener was registered for
- `callback` - The exact callback function that was registered

**Returns:** `boolean` - True if successfully removed

## Event Object
The callback receives the original keyboard event object with these useful properties:
- `key` - The key value
- `code` - The physical key code
- `shiftKey` - Whether shift was held
- `ctrlKey` - Whether ctrl was held
- `altKey` - Whether alt was held
- `repeat` - Whether this is a repeat event

## Example: Interactive Objects

```javascript
export class InteractionSystem {
  constructor(scriptingAPI) {
    this.api = scriptingAPI;
    this.interactables = new Map();
    this.handlers = {};
  }

  onLoad() {
    // Register interaction key
    this.handlers.interact = (event) => {
      if (!event.repeat) { // Ignore key repeat
        this.checkInteraction();
      }
    };
    this.api.onKeyDown('e', this.handlers.interact);

    // Register inventory keys
    for (let i = 1; i <= 5; i++) {
      const slot = i;
      this.handlers[`slot${i}`] = () => this.selectInventorySlot(slot);
      this.api.onKeyDown(i.toString(), this.handlers[`slot${i}`]);
    }

    // Register ability keys
    this.handlers.ability1 = () => this.useAbility(1);
    this.handlers.ability2 = () => this.useAbility(2);
    this.api.onKeyDown('q', this.handlers.ability1);
    this.api.onKeyDown('f', this.handlers.ability2);
  }

  checkInteraction() {
    const playerPos = this.api.getComponent(
      this.api.getLocalPlayer().entityId, 
      ComponentTypes.POSITION
    );

    // Find nearby interactables
    for (const [id, data] of this.interactables) {
      const distance = this.getDistance(playerPos, data.position);
      if (distance < 2.0) {
        this.interact(id, data);
        break;
      }
    }
  }

  cleanup() {
    // Remove all listeners when done
    this.api.removeKeyDownListener('e', this.handlers.interact);
    
    for (let i = 1; i <= 5; i++) {
      this.api.removeKeyDownListener(i.toString(), this.handlers[`slot${i}`]);
    }
    
    this.api.removeKeyDownListener('q', this.handlers.ability1);
    this.api.removeKeyDownListener('f', this.handlers.ability2);
  }
}
```

## Common Key Names

### Letters and Numbers
- `'a'` through `'z'` - Letter keys
- `'0'` through `'9'` - Number keys

### Special Keys
- `'enter'` - Enter/Return key
- `'escape'` - Escape key
- `'space'` or `' '` - Spacebar
- `'shift'` - Shift key
- `'control'` - Control key
- `'alt'` - Alt/Option key
- `'tab'` - Tab key
- `'backspace'` - Backspace key

### Arrow Keys
- `'arrowup'` - Up arrow
- `'arrowdown'` - Down arrow
- `'arrowleft'` - Left arrow
- `'arrowright'` - Right arrow

### Function Keys
- `'f1'` through `'f12'` - Function keys

## Best Practices

1. **Always store callback references** if you plan to remove listeners later
2. **Check for key repeat** with `event.repeat` to avoid spam
3. **Use meaningful callback names** for easier debugging
4. **Clean up listeners** in a cleanup method or when the script is destroyed
5. **Avoid conflicts** with existing controls (WASD, Space, Shift)
6. **Consider mobile users** - keyboard events don't work on mobile devices

## Reserved Keys
These keys are used by the game engine and should generally be avoided:
- WASD - Movement
- Space - Jump
- Shift - Sprint
- P - Stats toggle
- Mouse - Camera control