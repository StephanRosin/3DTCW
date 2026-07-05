import * as THREE from 'three';
import { createScene, createSky, createLights, createGround } from './world.js';
import { buildCourtRow } from './tennis.js';
import { buildForest, buildTerracePlateau, buildClubhouse, buildRestaurant } from './props.js';
import { buildEntrance } from './entrance.js';
import { buildScreens } from './screens.js';
import { createPlayer } from './player.js';
import { groundHeight } from './collision.js';

const app = document.getElementById('app');

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;
app.appendChild(renderer.domElement);

// --- Scene / sky / lights / ground ---
const scene = createScene();
const sunDir = createSky(scene);
createLights(scene, sunDir);
createGround(scene);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1200);

// --- Facility ---
const { courtX } = buildCourtRow(scene);

// Note: the provisional v1 clubhouse/terrace (south side) has been removed.
// The real clubhouse will be rebuilt on the north side in a later task, which is
// also why the north fence has no windscreen (clear sightline from the clubhouse).

// --- Terrace plateau (Task 6): ground-height model + grandstand steps ---
buildTerracePlateau(scene);

// --- Clubhouse + pergola terrace (Task 7) ---
buildClubhouse(scene);

// --- Restaurant: second long building spanning courts 4-6, east of the clubhouse ---
buildRestaurant(scene);

// --- Entrance portal: stone arch, TCW logo, Waidcup poster, forecourt plaza ---
const { startPos, lookTarget } = buildEntrance(scene);

// --- Standing screens on the tennis-club terrace (placeholder panels; ---
// wired up for a future companion WebApp via window.__tcw.setScreen).
const screenPanels = buildScreens(scene);

// --- Forest ring ---
buildForest(scene, 650, 75, 220);

// --- Player ---
const player = createPlayer(camera, renderer.domElement, startPos, lookTarget);
scene.add(camera);

// --- Overlay wiring ---
const overlay = document.getElementById('overlay');
const playBtn = document.getElementById('play');
const loading = document.getElementById('loading');

playBtn.addEventListener('click', () => {
  overlay.classList.add('hidden');
  player.start();
});
player.onStop = () => overlay.classList.remove('hidden');

// --- Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Debug handle (harmless; handy for inspecting the scene from the console).
window.__tcw = { scene, camera, renderer };

window.__tcw.teleport = (x, z, yawDeg = 0) => {
  camera.position.set(x, 1.7 + groundHeight(x, z), z);
  camera.rotation.set(0, yawDeg * Math.PI / 180, 0);
  player.setView?.(x, z, yawDeg);   // ab Task 6: hält yaw/pitch des Controllers synchron
};

// --- Standing-screen API (for a future companion WebApp) ----------------
// `screens[i]` is the panel Mesh (east -> west, i = 0..3). `setScreen(i, source)`
// accepts a THREE.Texture, HTMLCanvasElement, HTMLImageElement or
// HTMLVideoElement, wraps it in the right texture type, sets sRGB colour
// space, and assigns it to the panel's material map.
window.__tcw.screens = screenPanels;
window.__tcw.setScreen = (i, source) => {
  const panel = screenPanels[i];
  if (!panel) return;
  let tex;
  if (source instanceof THREE.Texture) {
    tex = source;
  } else if (typeof HTMLVideoElement !== 'undefined' && source instanceof HTMLVideoElement) {
    tex = new THREE.VideoTexture(source);
  } else if (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement) {
    tex = new THREE.CanvasTexture(source);
  } else if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement) {
    tex = new THREE.Texture(source);
    tex.needsUpdate = true;
  } else {
    return;
  }
  tex.colorSpace = THREE.SRGBColorSpace;
  panel.material.map?.dispose?.();
  panel.material.map = tex;
  panel.material.needsUpdate = true;
};

// --- Loop ---
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  player.update(dt);
  renderer.render(scene, camera);
}

// Hide the loading screen once the first frame is ready.
requestAnimationFrame(() => {
  loading.classList.add('hidden');
  animate();
});
