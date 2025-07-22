# TODO

## General

- [x] get name
- [x] start company

## Features

- [ ] oauth
- [ ] stripe
- [ ] avatar marketplace
- [ ] iframe
- [ ] screenshare
- [ ] voice chat

## Design

- [ ] improve room data and exit button appearance
- [ ] maybe get rid of the green theme on in world ui
- [ ] style properly for landscape mobile

### API

- [ ] pick up / drop weapons
- [ ] zoom in / scope

## Optimizations

- [ ] replace everything with bvh
- [ ] host / server avatars from cloudflare bucket
- [ ] run physics world on worker when user is tabbed out
- [ ] create separate fixed loop for physics

## Bugs

- [ ] when i spawn inside another player things go bad
- [ ] on tps cam, the environment seems to jitter when moving
- [ ] press enter to focus chat, pressing enter again unfocuses
- [ ] zoom doesnt feel great on tps cam
- [ ] player too far away from reticle on tps cam

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


## IERCAN

https://coda.io/d/_d4DpRlhYgW3/ECS-world-recap_su_C9IrS

- [ ] optimize packets
- [ ] uWebSockets server
- [ ] reduce first load impact (probably cloudflare)
- [ ] gzip compression static assets
- [ ] broadcast game state in fixed timestep
- [ ] zod schema input validation
- [ ] typescript