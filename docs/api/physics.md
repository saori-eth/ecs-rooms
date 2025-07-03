# Physics API

## Physics Body Management

### createPhysicsBody(shape, position, mass)
Creates a physics body with the given shape, position, and mass.
```javascript
const shape = new CANNON.Sphere(0.5);
const body = this.api.createPhysicsBody(
  shape, 
  { x: 0, y: 5, z: 0 }, 
  1.0  // mass in kg, 0 for static
);
```

### removePhysicsBody(body)
Removes a physics body from the world.
```javascript
this.api.removePhysicsBody(body);
```

## Common Shapes

### Sphere
```javascript
const shape = new CANNON.Sphere(radius);
```

### Box
```javascript
const shape = new CANNON.Box(new CANNON.Vec3(
  halfWidth, halfHeight, halfDepth
));
```

### Cylinder
```javascript
const shape = new CANNON.Cylinder(
  radiusTop, radiusBottom, height, numSegments
);
```

## Physics Properties

### Body Configuration
```javascript
body.velocity.set(vx, vy, vz);
body.angularVelocity.set(wx, wy, wz);
body.linearDamping = 0.4;
body.angularDamping = 0.4;
```

### Material Properties
Scene materials have:
- Friction: 0.4
- Restitution: 0.1

## Example: Projectile
```javascript
createProjectile(position, direction, speed) {
  const entityId = this.api.createEntity();
  
  // Physics
  const shape = new CANNON.Sphere(0.1);
  const body = this.api.createPhysicsBody(shape, position, 0.5);
  
  // Set velocity
  body.velocity.set(
    direction.x * speed,
    direction.y * speed,
    direction.z * speed
  );
  
  // Visual
  const geometry = new THREE.SphereGeometry(0.1);
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const mesh = new THREE.Mesh(geometry, material);
  this.api.getThreeScene().add(mesh);
  
  // Components
  this.api.addComponent(entityId, ComponentTypes.POSITION, position);
  this.api.addComponent(entityId, ComponentTypes.PHYSICS_BODY, { body });
  this.api.addComponent(entityId, ComponentTypes.MESH, { mesh });
  
  return entityId;
}
```