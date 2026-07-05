import * as THREE from 'three';
import { resolveCollisions } from './collision.js';

const EYE_HEIGHT = 1.7;
const RADIUS = 0.4;
const WALK = 5.5;
const RUN = 10.5;
const ACCEL = 12;
const WORLD_LIMIT = 240;
const SENS = 0.0022;               // mouse sensitivity
const PITCH_LIMIT = Math.PI / 2 - 0.05;

/**
 * First-person controller with two look modes:
 *  - Pointer Lock (preferred): click to capture the mouse, move freely.
 *  - Drag fallback: if pointer lock is unavailable/denied (e.g. embedded
 *    frames), hold the mouse button and drag to look around.
 * Keyboard movement works whenever the walk has been "started".
 */
export function createPlayer(camera, dom, startPos, lookAt) {
  camera.rotation.order = 'YXZ';
  camera.position.set(startPos.x, EYE_HEIGHT, startPos.z);

  let yaw = 0, pitch = 0;
  if (lookAt) {
    yaw = Math.atan2(-(lookAt.x - startPos.x), -(lookAt.z - startPos.z));
  }

  let started = false;
  let dragging = false;
  let onStop = () => {};

  const keys = Object.create(null);
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.code === 'Escape') stop();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  const isLocked = () => document.pointerLockElement === dom;

  function applyLook(dx, dy) {
    yaw -= dx * SENS;
    pitch -= dy * SENS;
    pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
  }

  document.addEventListener('mousemove', (e) => {
    if (!started) return;
    if (isLocked() || dragging) applyLook(e.movementX || 0, e.movementY || 0);
  });

  // Drag fallback (used when pointer lock is not active).
  dom.addEventListener('mousedown', () => { if (started && !isLocked()) { dragging = true; dom.style.cursor = 'grabbing'; } });
  window.addEventListener('mouseup', () => { dragging = false; dom.style.cursor = ''; });

  // Touch drag (mobile).
  let lastTouch = null;
  dom.addEventListener('touchstart', (e) => { if (started) lastTouch = e.touches[0]; }, { passive: true });
  dom.addEventListener('touchmove', (e) => {
    if (!started || !lastTouch) return;
    const t = e.touches[0];
    applyLook((t.clientX - lastTouch.clientX) * 2.2, (t.clientY - lastTouch.clientY) * 2.2);
    lastTouch = t;
  }, { passive: true });
  dom.addEventListener('touchend', () => { lastTouch = null; }, { passive: true });

  document.addEventListener('pointerlockchange', () => {
    document.body.classList.toggle('locked', isLocked());
  });

  function start() {
    started = true;
    document.body.classList.add('locked');
    // Attempt pointer lock; harmless if the frame denies it (drag mode still works).
    const p = dom.requestPointerLock?.();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }
  function stop() {
    if (!started) return;
    started = false;
    dragging = false;
    document.body.classList.remove('locked');
    if (isLocked()) document.exitPointerLock?.();
    onStop();
  }

  const velocity = new THREE.Vector3();

  function update(dt) {
    camera.rotation.set(pitch, yaw, 0);
    if (!started) { velocity.set(0, 0, 0); return; }

    const sinY = Math.sin(yaw), cosY = Math.cos(yaw);
    const fwd = { x: -sinY, z: -cosY };   // horizontal forward
    const right = { x: cosY, z: -sinY };

    const f = (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) - (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0);
    const s = (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) - (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0);

    let wx = fwd.x * f + right.x * s;
    let wz = fwd.z * f + right.z * s;
    const len = Math.hypot(wx, wz);
    if (len > 0) { wx /= len; wz /= len; }

    const speed = (keys['ShiftLeft'] || keys['ShiftRight']) ? RUN : WALK;
    const t = Math.min(1, ACCEL * dt);
    velocity.x += (wx * speed - velocity.x) * t;
    velocity.z += (wz * speed - velocity.z) * t;

    camera.position.x += velocity.x * dt;
    camera.position.z += velocity.z * dt;

    resolveCollisions(camera.position, RADIUS);

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -WORLD_LIMIT, WORLD_LIMIT);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -WORLD_LIMIT, WORLD_LIMIT);
    camera.position.y = EYE_HEIGHT;
  }

  return {
    update,
    start,
    stop,
    set onStop(fn) { onStop = fn; },
  };
}
