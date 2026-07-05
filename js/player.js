import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { resolveCollisions } from './collision.js';

const EYE_HEIGHT = 1.7;
const RADIUS = 0.4;
const WALK = 5.5;
const RUN = 10.5;
const ACCEL = 12;      // how fast we reach target velocity
const WORLD_LIMIT = 240;

export function createPlayer(camera, domElement, startPos, lookAt) {
  camera.position.set(startPos.x, EYE_HEIGHT, startPos.z);

  const controls = new PointerLockControls(camera, domElement);

  // Aim the camera at the initial look target.
  if (lookAt) {
    const tmp = new THREE.Vector3(lookAt.x, EYE_HEIGHT, lookAt.z);
    camera.lookAt(tmp);
  }

  const keys = Object.create(null);
  const onKey = (v) => (e) => {
    keys[e.code] = v;
    // prevent page scroll on arrows/space
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  };
  window.addEventListener('keydown', onKey(true));
  window.addEventListener('keyup', onKey(false));

  const velocity = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const wish = new THREE.Vector3();

  function update(dt) {
    if (!controls.isLocked) {
      velocity.set(0, 0, 0);
      return;
    }
    // Horizontal camera basis.
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.set(-forward.z, 0, forward.x); // forward × up

    const f = (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) - (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0);
    const s = (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) - (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0);

    wish.set(0, 0, 0);
    wish.addScaledVector(forward, f);
    wish.addScaledVector(right, s);
    if (wish.lengthSq() > 0) wish.normalize();

    const speed = (keys['ShiftLeft'] || keys['ShiftRight']) ? RUN : WALK;
    const targetX = wish.x * speed;
    const targetZ = wish.z * speed;

    // Smooth acceleration / deceleration.
    const t = Math.min(1, ACCEL * dt);
    velocity.x += (targetX - velocity.x) * t;
    velocity.z += (targetZ - velocity.z) * t;

    camera.position.x += velocity.x * dt;
    camera.position.z += velocity.z * dt;

    resolveCollisions(camera.position, RADIUS);

    // Keep inside the world and locked to eye height.
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -WORLD_LIMIT, WORLD_LIMIT);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -WORLD_LIMIT, WORLD_LIMIT);
    camera.position.y = EYE_HEIGHT;
  }

  return { controls, update };
}
