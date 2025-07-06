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

    // Create shapes for the capsule
    const sphereShape = new CANNON.Sphere(this.radius);
    const cylinderShape = new CANNON.Cylinder(
      this.radius,
      this.radius,
      this.height,
      8
    );
    const cylinderQuat = new CANNON.Quaternion();
    // Rotate 90 degrees around the X-axis so the cylinder's length aligns with the Y-axis
    cylinderQuat.setFromEuler(Math.PI / 2, 0, 0);

    // Create material with no friction to prevent sticking to walls/ledges
    const playerMaterial = new CANNON.Material("playerMaterial");
    playerMaterial.friction = 0.8;
    playerMaterial.restitution = 0.0; // No bouncing
    body.material = playerMaterial;

    // Add shapes to create capsule shape
    // Bottom sphere
    body.addShape(sphereShape, new CANNON.Vec3(0, -this.height / 2, 0));
    // Middle cylinder
    body.addShape(cylinderShape, new CANNON.Vec3(0, 0, 0), cylinderQuat);
    // Top sphere
    body.addShape(sphereShape, new CANNON.Vec3(0, this.height / 2, 0));

    return body;
  }
}
