import * as THREE from "three";

/**
 * Creates a nameplate texture with dynamic sizing and rounded edges
 * @param {string} name - The player's name to display
 * @param {Object} options - Configuration options
 * @returns {THREE.CanvasTexture} The generated texture for the nameplate
 */
export function createNameplateTexture(name, options = {}) {
  const {
    fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize = 24,
    padding = { x: 24, y: 12 },
    backgroundColor = "rgba(10, 10, 10, 0.7)",
    textColor = "rgba(255, 255, 255, 0.95)",
    borderRadius = 12,
    minWidth = 128,
    maxWidth = 512,
  } = options;

  // Create a temporary canvas to measure text
  const tempCanvas = document.createElement("canvas");
  const tempContext = tempCanvas.getContext("2d");
  tempContext.font = `${fontSize}px ${fontFamily}`;

  // Measure text dimensions
  const textMetrics = tempContext.measureText(name);
  const textWidth = textMetrics.width;

  // Calculate canvas dimensions with padding
  let canvasWidth = Math.ceil(textWidth + padding.x * 2);
  canvasWidth = Math.max(minWidth, Math.min(maxWidth, canvasWidth));

  // Make width power of 2 for better GPU performance
  canvasWidth = Math.pow(2, Math.ceil(Math.log2(canvasWidth)));

  const canvasHeight = Math.ceil(fontSize + padding.y * 2);

  // Create the actual canvas
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Clear canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw rounded rectangle background
  drawRoundedRect(
    context,
    0,
    0,
    canvas.width,
    canvas.height,
    borderRadius,
    backgroundColor
  );

  // Set text properties
  context.font = `${fontSize}px ${fontFamily}`;
  context.fillStyle = textColor;
  context.textAlign = "center";
  context.textBaseline = "middle";

  // Draw text
  context.fillText(name, canvas.width / 2, canvas.height / 2);

  // Create and return texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  return texture;
}

/**
 * Creates a nameplate sprite with proper scaling
 * @param {string} name - The player's name
 * @param {number} vrmHeight - The height of the VRM model (optional)
 * @returns {THREE.Sprite} The nameplate sprite
 */
export function createNameplateSprite(name, vrmHeight = 1.0) {
  const texture = createNameplateTexture(name);
  const material = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);

  // Calculate sprite dimensions based on texture aspect ratio
  const aspectRatio = texture.image.width / texture.image.height;
  const baseHeight = 0.12; // Base height relative to character
  const height = baseHeight * vrmHeight;
  const width = height * aspectRatio;

  sprite.scale.set(width, height, 1);

  // Position above the character's head
  sprite.position.set(0, vrmHeight * 0.8, 0);

  return sprite;
}

/**
 * Draws a rounded rectangle
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Width
 * @param {number} height - Height
 * @param {number} radius - Border radius
 * @param {string} fillColor - Fill color
 */
function drawRoundedRect(ctx, x, y, width, height, radius, fillColor) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.fill();
}
