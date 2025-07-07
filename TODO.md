# TODO

## General

- [ ] get name
- [ ] start company

## Features

- [ ] third person cam
- [ ] better falling speed
- [ ] jump
- [ ] oauth
- [ ] stripe
- [ ] avatar marketplace
- [ ] iframe
- [ ] screenshare
- [ ] voice chat

## Design

- [ ] improve room data and exit button appearance
- [ ] maybe get rid of the green theme on in world ui

### API

- [ ] pick up / drop weapons
- [ ] zoom in
- [ ] camera control

## Optimizations

- [ ] replace everything with bvh
- [ ] host / server avatars from cloudflare bucket
- [ ] run physics world on worker when user is tabbed out
- [ ] create separate fixed loop for physics

## Bugs

- [x] certain players float in the menu screen. probably in game too. files: client/src/MenuScene.js, client/src/VRMLoader.js
  - [ ] i think this is just an issue with the avatars themselves
- [x] player should jump higher, fall faster, right now it does alot of floating. it also goes up slopes too quickly and slides down them when standing still files: client/ecs/entities/Player.js, client/ecs/systems/MovementSystem.js, client/ecs/systems/PhysicsSystem.js
- [ ] mobile joystick controls are simultaneously registering as camera controls, and pinch zoom doesnt work: client/components/MobileControls.jsx, client/ecs/systems/InputSystem.js
- [ ] if i load the page on desktop, then switch to mobile through dev tools, i see the mobile controls but they dont work. files: client/components/MobileControls.jsx, keyword: 'isMobile'

## AI suggestions

React “Commit” (~69 % total time)
Green “Commit” events mean React is reconciling + updating the DOM.
If you’re calling setState (or a Redux‐like dispatch) every animation frame, the UI tree re-renders even though only the WebGL canvas changed.
Fix: throttle those updates or move stats/controls to a separate root that doesn’t rerender each rAF.

getProgramInfoLog every frame
That call should happen once per shader compile. Seeing it per-frame implies something (maybe runtime material edits) is forcing Three.js to rebuild programs, causing GPU stalls.
Fix: create materials once, avoid tweaking shader-defines/uniform counts inside the loop.

Frequent drawImage / fillText
Those are 2-D canvas calls; if you’re drawing HUD text each frame, cache to an off-screen canvas or use a bitmap font in WebGL.
