# Visual API

## Scene Access

### getThreeScene()
Returns the Three.js scene for adding custom meshes.
```javascript
const scene = this.api.getThreeScene();
scene.add(myMesh);
```

## Creating Visuals

### Basic Mesh
```javascript
// Geometry
const geometry = new THREE.BoxGeometry(1, 1, 1);

// Material
const material = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  metalness: 0.5,
  roughness: 0.5
});

// Mesh
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(x, y, z);
mesh.castShadow = true;
mesh.receiveShadow = true;

// Add to scene
this.api.getThreeScene().add(mesh);
```

### Mesh Component
Link mesh to entity for automatic position updates:
```javascript
this.api.addComponent(entityId, ComponentTypes.MESH, { mesh });
```

## Lighting
The scene includes:
- Ambient light: 0xffffff, intensity 0.6
- Directional light: 0xffffff, intensity 0.8

## Materials
Standard material setup:
```javascript
const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  map: texture,          // Diffuse texture
  normalMap: normalTex,  // Normal map
  roughnessMap: roughTex,// Roughness texture
  metalnessMap: metalTex,// Metalness texture
  envMapIntensity: 1.0
});
```

## Particle Systems
```javascript
// Particle geometry
const particleGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(count * 3);
// ... fill positions
particleGeometry.setAttribute('position', 
  new THREE.BufferAttribute(positions, 3)
);

// Particle material
const particleMaterial = new THREE.PointsMaterial({
  size: 0.1,
  color: 0xffffff,
  transparent: true,
  opacity: 0.8
});

// Points
const particles = new THREE.Points(particleGeometry, particleMaterial);
this.api.getThreeScene().add(particles);
```

## Cleanup
Always remove visuals when destroying entities:
```javascript
this.api.getThreeScene().remove(mesh);
mesh.geometry.dispose();
mesh.material.dispose();
```