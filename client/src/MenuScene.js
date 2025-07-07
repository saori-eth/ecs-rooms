import * as THREE from "three";
import { VRMManager } from "./VRMLoader.js";
import { AnimationManager } from "./AnimationManager.js";
import gsap from "gsap";
import GlobalEventManager from "./GlobalEventManager.js";

// Helper function to dispose of Three.js objects
function disposeNode(node) {
  if (node.isMesh) {
    if (node.geometry) {
      node.geometry.dispose();
    }
    if (node.material) {
      if (Array.isArray(node.material)) {
        node.material.forEach((material) => {
          if (material.map) material.map.dispose();
          if (material.metalnessMap) material.metalnessMap.dispose();
          if (material.normalMap) material.normalMap.dispose();
          if (material.roughnessMap) material.roughnessMap.dispose();
          material.dispose();
        });
      } else {
        if (node.material.map) node.material.map.dispose();
        if (node.material.metalnessMap) node.material.metalnessMap.dispose();
        if (node.material.normalMap) node.material.normalMap.dispose();
        if (node.material.roughnessMap) node.material.roughnessMap.dispose();
        node.material.dispose();
      }
    }
  }
}

export class MenuScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.vrmManager = new VRMManager();
    this.animationManager = new AnimationManager();
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.lights = {};
    this.currentAvatar = null;
    this.currentVRM = null;
    this.mixer = null;
    this.animationFrame = null;
    this.clock = new THREE.Clock();
    this.onAvatarLoaded = null; // Callback when avatar is loaded
    this.loadingSpinner = null;
    this.isLoadingAvatar = false; // Track loading state
    this.pendingAvatarId = null; // Track pending avatar to load
    this.currentAnimations = []; // Track active GSAP animations
    this.boundHandleResize = this.handleResize.bind(this); // Store bound function reference
  }

  init() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);
    this.scene.fog = new THREE.Fog(0x0a0a0a, 5, 15);

    // Camera setup
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 5);
    this.lookAtTarget = new THREE.Vector3(0, -0.2, 0);
    this.camera.lookAt(this.lookAtTarget);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Lighting setup
    this.setupLighting();

    // Add environment
    this.setupEnvironment();

    // Create loading spinner
    this.createLoadingSpinner();

    // Handle window resize
    GlobalEventManager.add(window, "resize", this.boundHandleResize);

    // Start animation loop
    this.animate();
  }

  setupLighting() {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);
    this.lights.ambient = ambientLight;

    // Main key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(2, 4, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -5;
    keyLight.shadow.camera.right = 5;
    keyLight.shadow.camera.top = 5;
    keyLight.shadow.camera.bottom = -5;
    this.scene.add(keyLight);
    this.lights.key = keyLight;

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x4080ff, 0.3);
    fillLight.position.set(-2, 2, -1);
    this.scene.add(fillLight);
    this.lights.fill = fillLight;

    // Rim light for character outline
    const rimLight = new THREE.DirectionalLight(0x8080ff, 0.5);
    rimLight.position.set(0, 1, -3);
    this.scene.add(rimLight);
    this.lights.rim = rimLight;

    // Point light for avatar highlighting
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 5);
    pointLight.position.set(0, 1, 2);
    this.scene.add(pointLight);
    this.lights.point = pointLight;
  }

  setupEnvironment() {
    // Ground plane
    const groundGeometry = new THREE.CircleGeometry(8, 32);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Add some atmospheric particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
    }

    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: 0x4080ff,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });

    const particlesMesh = new THREE.Points(
      particlesGeometry,
      particlesMaterial
    );
    this.scene.add(particlesMesh);

    // Animate particles
    gsap.to(particlesMesh.rotation, {
      y: Math.PI * 2,
      duration: 60,
      repeat: -1,
      ease: "none",
    });
  }

  createLoadingSpinner() {
    // Create a group for the loading spinner
    const spinnerGroup = new THREE.Group();
    spinnerGroup.position.set(0, -0.2, 0);

    // Create three torus rings
    const material1 = new THREE.MeshBasicMaterial({ color: 0x4080ff });
    const material2 = new THREE.MeshBasicMaterial({ color: 0x60a0ff });
    const material3 = new THREE.MeshBasicMaterial({ color: 0x80c0ff });

    const geometry1 = new THREE.TorusGeometry(0.4, 0.05, 16, 32);
    const geometry2 = new THREE.TorusGeometry(0.3, 0.05, 16, 32);
    const geometry3 = new THREE.TorusGeometry(0.2, 0.05, 16, 32);

    const ring1 = new THREE.Mesh(geometry1, material1);
    const ring2 = new THREE.Mesh(geometry2, material2);
    const ring3 = new THREE.Mesh(geometry3, material3);

    spinnerGroup.add(ring1, ring2, ring3);
    this.loadingSpinner = spinnerGroup;

    // Animate the spinner
    gsap.to(ring1.rotation, {
      z: Math.PI * 2,
      duration: 1.5,
      repeat: -1,
      ease: "none",
    });
    gsap.to(ring2.rotation, {
      z: -Math.PI * 2,
      duration: 1.3,
      repeat: -1,
      ease: "none",
    });
    gsap.to(ring3.rotation, {
      z: Math.PI * 2,
      duration: 1.1,
      repeat: -1,
      ease: "none",
    });
  }

  showLoadingSpinner() {
    if (this.loadingSpinner && !this.loadingSpinner.parent) {
      this.scene.add(this.loadingSpinner);
      gsap.from(this.loadingSpinner.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.3,
        ease: "back.out(1.7)",
      });
    }
  }

  hideLoadingSpinner() {
    if (this.loadingSpinner && this.loadingSpinner.parent) {
      gsap.to(this.loadingSpinner.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.3,
        ease: "back.in(1.7)",
        onComplete: () => {
          this.scene.remove(this.loadingSpinner);
        },
      });
    }
  }

  async loadAvatar(avatarId) {
    try {
      // Set loading state
      this.isLoadingAvatar = true;
      
      // Show loading spinner
      this.showLoadingSpinner();

      // Remove current avatar if exists
      if (this.currentAvatar) {
        this.scene.remove(this.currentAvatar);
        if (this.mixer) {
          this.mixer.stopAllAction();
          this.mixer = null;
        }
      }

      // Load VRM model
      const vrm = await this.vrmManager.loadVRM(avatarId);
      this.currentVRM = vrm;

      // Create container for the avatar
      const avatarGroup = new THREE.Group();
      avatarGroup.add(vrm.scene);

      // Scale avatar appropriately
      const box = new THREE.Box3().setFromObject(vrm.scene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1.8 / maxDim;
      vrm.scene.scale.setScalar(scale);

      // Rotate avatar to face forward
      avatarGroup.rotation.y = Math.PI;

      // Position avatar at fixed center
      avatarGroup.position.set(0, -1, 0);

      // Keep avatar hidden initially
      avatarGroup.visible = false;

      // Add to scene
      this.scene.add(avatarGroup);
      this.currentAvatar = avatarGroup;

      // Load and apply idle animation
      const animations = await this.animationManager.loadAndRetarget(vrm);
      if (animations && animations.idle) {
        this.mixer = new THREE.AnimationMixer(vrm.scene);
        const action = this.mixer.clipAction(animations.idle);
        action.play();
      }

      // Hide spinner and show avatar with entrance animation
      this.hideLoadingSpinner();

      // Wait a moment for spinner to fade out, then show avatar
      setTimeout(() => {
        avatarGroup.visible = true;

        // Add entrance animation
        gsap.from(avatarGroup.scale, {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.5,
          ease: "back.out(1.7)",
        });

        // Add subtle breathing/idle animation
        this.addIdleAnimation(avatarGroup);

        // Notify that avatar is loaded
        if (this.onAvatarLoaded) {
          this.onAvatarLoaded();
        }
        
        // Clear loading state
        this.isLoadingAvatar = false;
        
        // Check if there's a pending avatar to load
        if (this.pendingAvatarId) {
          const nextAvatarId = this.pendingAvatarId;
          this.pendingAvatarId = null;
          this.switchAvatar(nextAvatarId);
        }
      }, 300);
    } catch (error) {
      console.error("Failed to load avatar:", error);
      // Hide spinner on error
      this.hideLoadingSpinner();
      // Clear loading state
      this.isLoadingAvatar = false;
      // Still call the callback on error
      if (this.onAvatarLoaded) {
        this.onAvatarLoaded();
      }
      
      // Check if there's a pending avatar to load
      if (this.pendingAvatarId) {
        const nextAvatarId = this.pendingAvatarId;
        this.pendingAvatarId = null;
        this.switchAvatar(nextAvatarId);
      }
    }
  }

  addIdleAnimation(avatarGroup) {
    // Gentle sway
    gsap.to(avatarGroup.rotation, {
      z: 0.01,
      duration: 4,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    // Subtle vertical movement
    gsap.to(avatarGroup.position, {
      y: -0.98,
      duration: 2.5,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
  }

  async switchAvatar(newAvatarId) {
    // If currently loading an avatar
    if (this.isLoadingAvatar) {
      // Store the pending avatar to load after current one finishes
      this.pendingAvatarId = newAvatarId;
      return;
    }
    
    // Kill any existing animations
    this.currentAnimations.forEach(anim => {
      if (anim && anim.kill) anim.kill();
    });
    this.currentAnimations = [];
    
    // Fade out current avatar
    if (this.currentAvatar) {
      // Kill existing idle animations
      gsap.killTweensOf(this.currentAvatar.rotation);
      gsap.killTweensOf(this.currentAvatar.position);
      gsap.killTweensOf(this.currentAvatar.scale);

      const fadeOutAnim = gsap.to(this.currentAvatar.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.3,
        ease: "back.in(1.7)",
        onComplete: () => {
          this.loadAvatar(newAvatarId);
        },
      });
      
      this.currentAnimations.push(fadeOutAnim);
    } else {
      this.loadAvatar(newAvatarId);
    }
  }

  setAvatarPosition(position) {
    // Pan camera smoothly based on view
    if (position === "left") {
      // Inventory view - move camera right to show avatar on left third
      gsap.to(this.camera.position, {
        x: 2,
        y: 0,
        z: 5,
        duration: 0.4,
        ease: "power2.inOut",
        onUpdate: () => {
          this.camera.lookAt(this.lookAtTarget);
        },
      });
    } else {
      // Lobby view - center the avatar
      gsap.to(this.camera.position, {
        x: 0,
        y: 0,
        z: 5,
        duration: 0.4,
        ease: "power2.inOut",
        onUpdate: () => {
          this.camera.lookAt(this.lookAtTarget);
        },
      });
    }
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationFrame = requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();

    // Update animation mixer
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // Update VRM if needed
    if (this.currentVRM && this.currentVRM.update) {
      this.currentVRM.update(delta);
    }

    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    // Stop animation loop
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    // Remove event listeners
    GlobalEventManager.remove(window, "resize", this.boundHandleResize);

    // Dispose of Three.js objects
    if (this.currentAvatar) {
      // Properly dispose of all geometry and materials
      this.currentAvatar.traverse(disposeNode);
      this.scene.remove(this.currentAvatar);
    }

    if (this.mixer) {
      this.mixer.stopAllAction();
    }

    // Dispose of scene objects
    if (this.scene) {
      this.scene.traverse(disposeNode);
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
    }

    // Dispose VRM manager
    if (this.vrmManager) {
      this.vrmManager.dispose();
    }

    // Dispose animation manager
    if (this.animationManager) {
      this.animationManager.dispose();
    }

    // Clear references
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.currentAvatar = null;
    this.currentVRM = null;
    this.mixer = null;
  }
}
