import * as CANNON from "cannon-es";

export class CapsuleCollider {
  constructor(radius = 0.3, height = 1.0) {
    this.radius = radius;
    this.height = height;
  }

  createBody(position = { x: 0, y: 0, z: 0 }, mass = 1, isLocal = true) {
    const body = new CANNON.Body({
      mass: isLocal ? mass : 0,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      linearDamping: 0.3,
      angularDamping: 0.8,
      fixedRotation: true, // Prevent capsule from tipping over
    });

    // Enable CCD (Continuous Collision Detection) to prevent tunneling at high speeds
    body.ccdSpeedThreshold = 1; // Enable CCD when moving faster than 1 units/s
    body.ccdIterations = 20; // Number of CCD iterations

    // Create shapes for the capsule
    const sphereShape = new CANNON.Sphere(this.radius);
    const cylinderShape = new CANNON.Cylinder(
      this.radius,
      this.radius,
      this.height,
      16  // Increased resolution from 8 to 16
    );

    // Create material with low default friction for smooth movement
    const playerMaterial = new CANNON.Material("playerMaterial");
    playerMaterial.friction = 0.2;
    playerMaterial.restitution = 0.0; // No bouncing
    body.material = playerMaterial;

    // Add shapes to create capsule shape
    // Bottom sphere
    body.addShape(sphereShape, new CANNON.Vec3(0, -this.height / 2, 0));
    // Middle cylinder (no rotation needed - Cannon cylinders are vertical by default)
    body.addShape(cylinderShape, new CANNON.Vec3(0, 0, 0));
    // Top sphere
    body.addShape(sphereShape, new CANNON.Vec3(0, this.height / 2, 0));

    return body;
  }
}
