import * as THREE from "three";
import * as CANNON from "cannon-es";
import { ComponentTypes } from "../../../ecs/components.js";

export class ArenaShootingGame {
  constructor(scriptingAPI) {
    this.api = scriptingAPI;
    this.enemies = new Map();
    this.projectiles = new Map();
    this.scores = new Map();
    this.spawnTimer = 0;
    this.spawnInterval = 5; // seconds between spawns
    this.enemySpeed = 2;
    this.projectileSpeed = 20;
    this.isHost = false; // Will be determined on first update
    this.gameStarted = false;

    // Materials
    this.enemyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.3,
    });
    this.projectileMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5,
    });

    // Debug mode
    this.debugMode = true; // Set to false to hide debug visuals
  }

  onLoad() {
    console.log("Arena Shooting Game loaded!");
    console.log("[ArenaShootingGame] API:", this.api);
    console.log("[ArenaShootingGame] NetworkSystem:", this.api.networkSystem);

    // Set up network event handler
    if (this.api.networkSystem) {
      this.api.networkSystem.onGameEvent = this.handleGameEvent.bind(this);
      console.log("[ArenaShootingGame] Network event handler set up");
    } else {
      console.error("[ArenaShootingGame] No networkSystem available!");
    }

    // Listen for shooting input
    window.addEventListener("click", this.handleShoot.bind(this));
    window.addEventListener("touchstart", this.handleShoot.bind(this));

    // Add debug helpers
    if (this.debugMode) {
      // Add coordinate helpers
      const axesHelper = new THREE.AxesHelper(5);
      this.api.getThreeScene().add(axesHelper);

      // Add grid
      const gridHelper = new THREE.GridHelper(10, 10);
      this.api.getThreeScene().add(gridHelper);

      console.log("[ArenaShootingGame] Debug helpers added");
    }
    console.log("[ArenaShootingGame] Event listeners added");
  }

  onUpdate(deltaTime) {
    // Reduce log spam - only log once every second
    if (!this.lastLogTime || Date.now() - this.lastLogTime > 1000) {
      this.lastLogTime = Date.now();
    }

    // Determine if we're the host (first player in room)
    if (!this.gameStarted) {
      const players = this.api.getEntitiesWithComponents(ComponentTypes.PLAYER);
      if (players.length > 0) {
        this.isHost = true; // For now, everyone acts as host for their view
        this.gameStarted = true;
      }
      return;
    }

    // Host spawns enemies
    if (this.isHost) {
      // Guard against invalid deltaTime
      if (!isNaN(deltaTime) && deltaTime > 0) {
        this.spawnTimer += deltaTime;

        // Log timer progress periodically
        if (!this.lastTimerLog || Date.now() - this.lastTimerLog > 1000) {
          this.lastTimerLog = Date.now();
        }

        if (this.spawnTimer >= this.spawnInterval) {
          this.spawnEnemy();
          this.spawnTimer = 0;
        }
      } else {
        console.warn("[ArenaShootingGame] Invalid deltaTime:", deltaTime);
      }
    }

    // Update enemies
    this.updateEnemies(deltaTime);

    // Update projectiles
    this.updateProjectiles(deltaTime);

    // Check collisions
    this.checkCollisions();
  }

  spawnEnemy() {
    const enemyId = `enemy_${Date.now()}_${Math.random()}`;

    // Random position around the arena - reduced distance for smaller arenas
    const angle = Math.random() * Math.PI * 2;
    const distance = 3 + Math.random() * 2; // 3-5 units away
    const position = {
      x: Math.cos(angle) * distance,
      y: 1.5, // Same height as player
      z: Math.sin(angle) * distance,
    };

    console.log(
      "[ArenaShootingGame] Spawning enemy:",
      enemyId,
      "at position:",
      position
    );

    // Create enemy locally
    this.createEnemy(enemyId, position);

    // Broadcast spawn event
    this.api.sendGameEvent("spawnEnemy", {
      id: enemyId,
      position: position,
    });
    console.log("[ArenaShootingGame] Enemy spawn event sent");
  }

  createEnemy(id, position) {
    console.log(
      "[ArenaShootingGame] Creating enemy at position:",
      position,
      "height:",
      position.y
    );

    // Create visual
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const mesh = new THREE.Mesh(geometry, this.enemyMaterial);
    mesh.position.set(position.x, position.y, position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.api.getThreeScene().add(mesh);

    // Add spawn indicator if debug mode
    if (this.debugMode) {
      const indicatorGeometry = new THREE.RingGeometry(0.3, 0.5, 8);
      const indicatorMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
      indicator.position.copy(mesh.position);
      indicator.rotation.x = -Math.PI / 2;
      this.api.getThreeScene().add(indicator);

      // Remove indicator after 1 second
      setTimeout(() => {
        this.api.getThreeScene().remove(indicator);
      }, 1000);
    }

    // Create physics
    const shape = new CANNON.Sphere(0.3);
    const body = this.api.createPhysicsBody(shape, position, 1);
    body.linearDamping = 0.4;

    // Store enemy data
    this.enemies.set(id, {
      mesh: mesh,
      body: body,
      health: 1,
    });

    console.log(
      "[ArenaShootingGame] Enemy created. Total enemies:",
      this.enemies.size
    );
  }

  updateEnemies(deltaTime) {
    const players = this.api.getEntitiesWithComponents(
      ComponentTypes.POSITION,
      ComponentTypes.PLAYER
    );

    this.enemies.forEach((enemy, id) => {
      if (players.length > 0) {
        // Find closest player
        let closestPlayer = null;
        let closestDistance = Infinity;

        players.forEach((playerId) => {
          const playerPos = this.api.getComponent(
            playerId,
            ComponentTypes.POSITION
          );
          const distance = new THREE.Vector3(
            playerPos.x - enemy.body.position.x,
            0,
            playerPos.z - enemy.body.position.z
          ).length();

          if (distance < closestDistance) {
            closestDistance = distance;
            closestPlayer = playerPos;
          }
        });

        if (closestPlayer) {
          // Move towards closest player
          const direction = new THREE.Vector3(
            closestPlayer.x - enemy.body.position.x,
            0,
            closestPlayer.z - enemy.body.position.z
          ).normalize();

          enemy.body.velocity.x = direction.x * this.enemySpeed;
          enemy.body.velocity.z = direction.z * this.enemySpeed;
        }
      }

      // Update visual position from physics
      enemy.mesh.position.copy(enemy.body.position);
    });
  }

  handleShoot(event) {
    event.preventDefault();
    console.log("[ArenaShootingGame] handleShoot called");

    // Get player position and rotation
    const players = this.api.getEntitiesWithComponents(
      ComponentTypes.POSITION,
      ComponentTypes.PLAYER,
      ComponentTypes.VRM
    );
    console.log("[ArenaShootingGame] All players with components:", players);
    const localPlayers = [];

    players.forEach((playerId) => {
      const player = this.api.getComponent(playerId, ComponentTypes.PLAYER);
      console.log("[ArenaShootingGame] Player component:", player);
      if (player && player.isLocal) {
        localPlayers.push(playerId);
      }
    });

    console.log(
      "[ArenaShootingGame] Local players found:",
      localPlayers.length
    );
    if (localPlayers.length === 0) return;

    const playerId = localPlayers[0];
    const position = this.api.getComponent(playerId, ComponentTypes.POSITION);
    const vrm = this.api.getComponent(playerId, ComponentTypes.VRM);

    if (!position || !vrm) return;

    // Simple forward shooting with slight downward angle
    const quaternion = vrm.vrm.scene.quaternion;
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(quaternion);
    direction.y = -0.1; // Slight downward angle
    direction.normalize();

    const projectileId = `proj_${Date.now()}_${Math.random()}`;
    const startPos = {
      x: position.x,
      y: position.y, // Shoot from player center height
      z: position.z,
    };

    // Create projectile locally
    this.createProjectile(projectileId, startPos, direction);

    // Broadcast shoot event
    this.api.sendGameEvent("shoot", {
      id: projectileId,
      position: startPos,
      direction: { x: direction.x, y: direction.y, z: direction.z },
    });
  }

  createProjectile(id, position, direction) {
    console.log(
      "[ArenaShootingGame] Creating projectile at height:",
      position.y,
      "direction:",
      direction
    );

    // Create visual
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const mesh = new THREE.Mesh(geometry, this.projectileMaterial);
    mesh.position.set(position.x, position.y, position.z);
    this.api.getThreeScene().add(mesh);

    // Create physics
    const shape = new CANNON.Sphere(0.1);
    const body = this.api.createPhysicsBody(shape, position, 0.1);
    body.velocity.set(
      direction.x * this.projectileSpeed,
      direction.y * this.projectileSpeed,
      direction.z * this.projectileSpeed
    );

    // Store projectile data
    this.projectiles.set(id, {
      mesh: mesh,
      body: body,
      lifetime: 5, // seconds
    });
  }

  updateProjectiles(deltaTime) {
    const toRemove = [];

    this.projectiles.forEach((projectile, id) => {
      // Update visual position from physics
      projectile.mesh.position.copy(projectile.body.position);

      // Update lifetime
      projectile.lifetime -= deltaTime;
      if (projectile.lifetime <= 0) {
        toRemove.push(id);
      }
    });

    // Remove expired projectiles
    toRemove.forEach((id) => this.removeProjectile(id));
  }

  checkCollisions() {
    const toRemoveProjectiles = [];
    const toRemoveEnemies = [];

    this.projectiles.forEach((projectile, projId) => {
      this.enemies.forEach((enemy, enemyId) => {
        const distance = projectile.body.position.distanceTo(
          enemy.body.position
        );
        if (distance < 0.4) {
          // Hit! (0.3 enemy radius + 0.1 projectile radius)
          console.log("[ArenaShootingGame] Hit detected! Distance:", distance);
          toRemoveProjectiles.push(projId);
          toRemoveEnemies.push(enemyId);

          // Broadcast hit event
          this.api.sendGameEvent("hit", {
            projectileId: projId,
            enemyId: enemyId,
          });

          // Create explosion effect
          this.createExplosion(enemy.body.position);
        }
      });
    });

    // Remove hit objects
    toRemoveProjectiles.forEach((id) => this.removeProjectile(id));
    toRemoveEnemies.forEach((id) => this.removeEnemy(id));
  }

  createExplosion(position) {
    // Simple particle effect
    const particles = [];
    const particleCount = 10;

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 1,
      });
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);

      // Random velocity
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 5,
        (Math.random() - 0.5) * 5
      );

      this.api.getThreeScene().add(particle);
      particles.push({ mesh: particle, velocity: velocity, life: 1 });
    }

    // Animate particles
    const animateParticles = () => {
      let allDead = true;

      particles.forEach((p) => {
        if (p.life > 0) {
          allDead = false;
          p.life -= 0.02;
          p.mesh.material.opacity = p.life;
          p.mesh.position.add(p.velocity.clone().multiplyScalar(0.02));
          p.velocity.y -= 0.2; // gravity
        }
      });

      if (!allDead) {
        requestAnimationFrame(animateParticles);
      } else {
        particles.forEach((p) => this.api.getThreeScene().remove(p.mesh));
      }
    };

    animateParticles();
  }

  removeProjectile(id) {
    const projectile = this.projectiles.get(id);
    if (projectile) {
      this.api.getThreeScene().remove(projectile.mesh);
      this.api.removePhysicsBody(projectile.body);
      this.projectiles.delete(id);
    }
  }

  removeEnemy(id) {
    const enemy = this.enemies.get(id);
    if (enemy) {
      this.api.getThreeScene().remove(enemy.mesh);
      this.api.removePhysicsBody(enemy.body);
      this.enemies.delete(id);
    }
  }

  handleGameEvent(event) {
    console.log("[ArenaShootingGame] handleGameEvent called:", event);
    switch (event.eventType) {
      case "spawnEnemy":
        if (!this.enemies.has(event.data.id)) {
          this.createEnemy(event.data.id, event.data.position);
        }
        break;

      case "shoot":
        if (!this.projectiles.has(event.data.id)) {
          this.createProjectile(
            event.data.id,
            event.data.position,
            new THREE.Vector3(
              event.data.direction.x,
              event.data.direction.y,
              event.data.direction.z
            )
          );
        }
        break;

      case "hit":
        this.removeProjectile(event.data.projectileId);
        this.removeEnemy(event.data.enemyId);
        this.createExplosion(
          this.enemies.get(event.data.enemyId)?.body.position ||
            new THREE.Vector3()
        );
        break;
    }
  }

  onPlayerJoin(playerId) {
    this.scores.set(playerId, 0);

    // If we're the host, send current game state to new player
    if (this.isHost && this.enemies.size > 0) {
      console.log("[ArenaShootingGame] Sending game state to new player");

      // Send all existing enemies
      this.enemies.forEach((enemy, id) => {
        this.api.sendGameEvent("spawnEnemy", {
          id: id,
          position: {
            x: enemy.body.position.x,
            y: enemy.body.position.y,
            z: enemy.body.position.z,
          },
        });
      });
    }
  }

  onPlayerLeave(playerId) {
    this.scores.delete(playerId);
  }
}
