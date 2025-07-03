# Debug Guide for Arena Shooting Game

## Debug Points Added

### 1. Enemy Spawning Issues

**In `arena-shooting-game.js`:**
- `[ArenaShootingGame] API:` - Shows if the API is properly initialized
- `[ArenaShootingGame] NetworkSystem:` - Shows if network system is available
- `[ArenaShootingGame] onUpdate called` - Confirms update loop is running (logs once per second)
- `[ArenaShootingGame] Players found:` - Shows number of players detected
- `[ArenaShootingGame] Game started! isHost:` - Confirms game initialization
- `[ArenaShootingGame] Spawn timer progress:` - Shows spawn timer counting up
- `[ArenaShootingGame] Time to spawn enemy!` - Confirms when enemy spawn is triggered
- `[ArenaShootingGame] Spawning enemy:` - Shows enemy ID and position
- `[ArenaShootingGame] Enemy spawn event sent` - Confirms network event was sent
- `[ArenaShootingGame] handleGameEvent called:` - Shows if network events are received

**In `NetworkSystem.js`:**
- `[NetworkSystem] sendGameEvent called:` - Shows when game events are sent
- `[NetworkSystem] Sending game event:` - Shows the actual event data
- `[NetworkSystem] Received game event:` - Shows when game events are received from server

**In `SceneManager.js`:**
- `[SceneManager] No active script` - Shows if script failed to load

### 2. Chat Issues

**In `Chat.jsx`:**
- `[Chat] handleSubmit called` - Confirms button click is registered
- `[Chat] trimmedMessage:` - Shows the message being sent
- `[Chat] gameManager:` - Confirms gameManager is available
- `[Chat] Sending message:` - Confirms message is being sent
- `[Chat] Setting up chat message handler` - Confirms handler setup
- `[Chat] Received message:` - Shows when messages are received

**In `NetworkSystem.js`:**
- `[NetworkSystem] sendChatMessage called with:` - Shows chat message being sent
- `[NetworkSystem] connected:`, `ws ready:`, `inRoom:` - Shows connection status
- `[NetworkSystem] Sending chat message:` - Shows the actual message data
- `[NetworkSystem] Received chat message:` - Shows when chat messages are received

## What to Look For

### For Enemy Spawning:
1. Check if `onUpdate` is being called regularly
2. Verify players are detected (`Players found: > 0`)
3. Confirm timer is counting up to 3 seconds
4. Look for "Time to spawn enemy!" message
5. Check if game events are being sent and received

### For Chat:
1. Verify button clicks are registered
2. Check if gameManager is properly initialized
3. Confirm connection status (connected: true, inRoom: true)
4. Look for chat messages being sent and received

## Common Issues:

1. **No enemies spawning:**
   - Component types were using strings instead of constants (fixed)
   - Check if deltaTime is valid (added guards)
   - Verify network events are working

2. **Chat not working:**
   - Check if player is in a room (`inRoom: true`)
   - Verify WebSocket connection is open
   - Ensure chat handler is set up

3. **Script not loading:**
   - Check for import errors in console
   - Verify room type is correct ("default-arena")