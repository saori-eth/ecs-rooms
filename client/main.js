import * as THREE from 'three'
import { World } from './ecs/World.js'
import { createMovementSystem } from './ecs/systems/MovementSystem.js'
import { createRenderSystem } from './ecs/systems/RenderSystem.js'
import { createInputSystem } from './ecs/systems/InputSystem.js'
import { createNetworkSystem } from './ecs/systems/NetworkSystem.js'
import { createInterpolationSystem } from './ecs/systems/InterpolationSystem.js'
import { createPhysicsSystem } from './ecs/systems/PhysicsSystem.js'
import { createPlayer } from './entities/Player.js'
import { GameStateManager } from './GameStateManager.js'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x202020)

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 10, 10)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(10, 10, 5)
directionalLight.castShadow = true
directionalLight.shadow.camera.near = 0.1
directionalLight.shadow.camera.far = 50
directionalLight.shadow.camera.left = -10
directionalLight.shadow.camera.right = 10
directionalLight.shadow.camera.top = 10
directionalLight.shadow.camera.bottom = -10
scene.add(directionalLight)

const groundGeometry = new THREE.PlaneGeometry(50, 50)
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 })
const ground = new THREE.Mesh(groundGeometry, groundMaterial)
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

const world = new World()
const gameStateManager = new GameStateManager()

const physicsSystem = createPhysicsSystem()
world.physicsWorld = physicsSystem.world

const networkSystem = createNetworkSystem()
networkSystem.setGameStateManager(gameStateManager)

world.registerSystem(createInputSystem())
world.registerSystem(createMovementSystem())
world.registerSystem(physicsSystem)
world.registerSystem(createInterpolationSystem())
world.registerSystem(createRenderSystem(scene))
world.registerSystem(networkSystem)

window.scene = scene
window.physicsWorld = physicsSystem.world

let localPlayerId = null
let gameStarted = false

gameStateManager.playButton.addEventListener('click', () => {
  networkSystem.joinGame()
})

gameStateManager.onStateChange = (newState) => {
  if (newState === 'playing' && !gameStarted) {
    localPlayerId = createPlayer(world, { x: 0, y: 2, z: 0 }, true, physicsSystem.world)
    gameStarted = true
  } else if (newState === 'menu' && gameStarted) {
    if (localPlayerId) {
      const meshComponent = world.getComponent(localPlayerId, 'mesh')
      if (meshComponent && meshComponent.mesh) {
        scene.remove(meshComponent.mesh)
      }
      const physicsComponent = world.getComponent(localPlayerId, 'physicsBody')
      if (physicsComponent && physicsComponent.body) {
        physicsSystem.world.removeBody(physicsComponent.body)
      }
      world.destroyEntity(localPlayerId)
      localPlayerId = null
    }
    gameStarted = false
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

let lastTime = 0
function animate(time) {
  requestAnimationFrame(animate)
  
  const deltaTime = (time - lastTime) / 1000
  lastTime = time
  
  world.update(deltaTime)
  
  renderer.render(scene, camera)
}

requestAnimationFrame(animate)