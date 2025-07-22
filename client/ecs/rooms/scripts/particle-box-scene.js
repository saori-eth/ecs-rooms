import * as THREE from "three";

export class ParticleBoxScene {
  constructor(scriptingAPI) {
    this.api = scriptingAPI;
    this.particleSystems = [];
    this.time = 0;
  }

  onLoad() {
    // Create multiple particle systems for variety
    this.createFloatingDustParticles();
    this.createMagicalOrbParticles();
    this.createFireflyParticles();
    this.createEnergyFieldParticles();
    this.createGroundFogParticles();
  }

  createFloatingDustParticles() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    // Spread particles in a 10x10x10 area
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 10; // x
      positions[i + 1] = 2 + Math.random() * 5; // y (2 to 7)
      positions[i + 2] = (Math.random() - 0.5) * 10; // z

      // Random velocities for gentle floating
      velocities[i] = (Math.random() - 0.5) * 0.02;
      velocities[i + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i + 2] = (Math.random() - 0.5) * 0.02;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    this.api.getThreeScene().add(particles);

    this.particleSystems.push({
      type: "dust",
      particles,
      geometry,
      velocities,
    });
  }

  createMagicalOrbParticles() {
    const particleCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 2 + Math.random() * 1;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 4 + Math.sin(i * 0.1) * 0.5; // Raised from 2 to 4
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Purple to blue gradient
      colors[i * 3] = 0.5 + Math.random() * 0.5; // R
      colors[i * 3 + 1] = 0.2 + Math.random() * 0.3; // G
      colors[i * 3 + 2] = 0.8 + Math.random() * 0.2; // B

      sizes[i] = 0.1 + Math.random() * 0.1;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    this.api.getThreeScene().add(particles);

    this.particleSystems.push({
      type: "orbs",
      particles,
      geometry,
      particleCount,
    });
  }

  createFireflyParticles() {
    const particleCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = 3 + Math.random() * 3; // Raised from 1-4 to 3-6
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.2,
      color: 0xffff00,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    this.api.getThreeScene().add(particles);

    this.particleSystems.push({
      type: "fireflies",
      particles,
      geometry,
      phases,
      particleCount,
    });
  }

  createEnergyFieldParticles() {
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const alphas = new Float32Array(particleCount);

    // Create a cylindrical energy field
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const height = Math.random() * 4;
      const radius = 3 + Math.random() * 0.5;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height + 2; // Raised by 2 units
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      alphas[i] = 0.3 + Math.random() * 0.7;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));

    const material = new THREE.PointsMaterial({
      size: 0.08,
      color: 0x00ffff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    this.api.getThreeScene().add(particles);

    this.particleSystems.push({
      type: "energy",
      particles,
      geometry,
      alphas,
    });
  }

  createGroundFogParticles() {
    const particleCount = 150;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = 2 + Math.random() * 0.3; // Raised by 2 units (was 0-0.3, now 2-2.3)
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;

      sizes[i] = 0.2 + Math.random() * 0.3;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      color: 0xcccccc,
      transparent: true,
      opacity: 0.3,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    this.api.getThreeScene().add(particles);

    this.particleSystems.push({
      type: "fog",
      particles,
      geometry,
    });
  }

  onUpdate(deltaTime) {
    this.time += deltaTime;

    // Update each particle system
    this.particleSystems.forEach((system) => {
      if (system.type === "dust") {
        this.updateDustParticles(system);
      } else if (system.type === "orbs") {
        this.updateOrbParticles(system);
      } else if (system.type === "fireflies") {
        this.updateFireflyParticles(system);
      } else if (system.type === "energy") {
        this.updateEnergyParticles(system);
      } else if (system.type === "fog") {
        this.updateFogParticles(system);
      }
    });
  }

  updateDustParticles(system) {
    const positions = system.geometry.attributes.position.array;
    const velocities = system.velocities;

    for (let i = 0; i < positions.length; i += 3) {
      // Update positions with velocity
      positions[i] += velocities[i];
      positions[i + 1] += velocities[i + 1];
      positions[i + 2] += velocities[i + 2];

      // Wrap around boundaries
      if (positions[i] > 5) positions[i] = -5;
      if (positions[i] < -5) positions[i] = 5;
      if (positions[i + 1] > 7) positions[i + 1] = 2; // Updated for raised particles
      if (positions[i + 1] < 2) positions[i + 1] = 7; // Updated for raised particles
      if (positions[i + 2] > 5) positions[i + 2] = -5;
      if (positions[i + 2] < -5) positions[i + 2] = 5;
    }

    system.geometry.attributes.position.needsUpdate = true;
  }

  updateOrbParticles(system) {
    const positions = system.geometry.attributes.position.array;
    const particleCount = system.particleCount;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + this.time * 0.2;
      const radius = 2 + Math.sin(this.time + i * 0.1) * 0.5;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 4 + Math.sin(this.time * 2 + i * 0.2) * 0.3; // Updated to match raised position
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    system.geometry.attributes.position.needsUpdate = true;
  }

  updateFireflyParticles(system) {
    const positions = system.geometry.attributes.position.array;
    const phases = system.phases;
    const particleCount = system.particleCount;

    for (let i = 0; i < particleCount; i++) {
      // Circular motion with some randomness
      const phase = phases[i] + this.time * 0.5;
      const radius = 0.5 + Math.sin(phase * 2) * 0.3;

      positions[i * 3] += Math.cos(phase) * radius * 0.02;
      positions[i * 3 + 1] += Math.sin(phase * 3) * 0.01;
      positions[i * 3 + 2] += Math.sin(phase) * radius * 0.02;

      // Boundary check
      if (Math.abs(positions[i * 3]) > 4) positions[i * 3] *= -0.9;
      if (positions[i * 3 + 1] < 3) positions[i * 3 + 1] = 3; // Updated for raised particles
      if (positions[i * 3 + 1] > 6) positions[i * 3 + 1] = 6; // Updated for raised particles
      if (Math.abs(positions[i * 3 + 2]) > 4) positions[i * 3 + 2] *= -0.9;
    }

    // Pulsing glow effect
    system.particles.material.opacity = 0.6 + Math.sin(this.time * 3) * 0.3;

    system.geometry.attributes.position.needsUpdate = true;
  }

  updateEnergyParticles(system) {
    const positions = system.geometry.attributes.position.array;

    // Rotate the entire energy field
    system.particles.rotation.y += 0.002;

    // Vertical wave motion
    for (let i = 0; i < positions.length; i += 3) {
      const originalY = positions[i + 1];
      positions[i + 1] = originalY + Math.sin(this.time * 2 + i * 0.1) * 0.02;
    }

    system.geometry.attributes.position.needsUpdate = true;
  }

  updateFogParticles(system) {
    const positions = system.geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      // Slow drift
      positions[i] += Math.sin(this.time * 0.1 + i) * 0.003;
      positions[i + 2] += Math.cos(this.time * 0.1 + i) * 0.003;

      // Keep within bounds
      if (Math.abs(positions[i]) > 6) positions[i] = -positions[i] * 0.9;
      if (Math.abs(positions[i + 2]) > 6)
        positions[i + 2] = -positions[i + 2] * 0.9;
    }

    system.geometry.attributes.position.needsUpdate = true;
  }

  onPlayerJoin(playerId) {
    // Particles are visual only, no special handling needed
  }

  onPlayerLeave(playerId) {
    // Particles are visual only, no special handling needed
  }

  // Clean up when room is destroyed
  destroy() {
    this.particleSystems.forEach((system) => {
      this.api.getThreeScene().remove(system.particles);
      system.geometry.dispose();
      system.particles.material.dispose();
    });
    this.particleSystems = [];
  }
}
