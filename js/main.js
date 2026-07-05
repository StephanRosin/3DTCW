import * as THREE from 'three';
import { createScene, createSky, createLights, createGround } from './world.js';
import { buildCourtBlock } from './tennis.js';
import {
  buildClubhouse, buildTable, buildChair, buildUmbrella,
  buildBench, buildHedge, buildForest
} from './props.js';
import { createPlayer } from './player.js';

const app = document.getElementById('app');

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.72;
app.appendChild(renderer.domElement);

// --- Scene / sky / lights / ground ---
const scene = createScene();
const sunDir = createSky(scene);
createLights(scene, sunDir);
createGround(scene);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1200);

// --- Facility ---
const { halfBlockZ } = buildCourtBlock(scene);

// Clubhouse + terrace sit on the +Z (south) side, in front of the courts.
const terraceFrontZ = halfBlockZ + 12;      // front edge of terrace, gap to courts
const clubhouseX = 0;
const terraceCenter = buildClubhouse(scene, clubhouseX, terraceFrontZ);

// --- Furnish the terrace ---
// A few tables with chairs; one designated as the start point (the white table).
const startTablePos = buildTable(scene, terraceCenter.x - 3.5, terraceCenter.z + 0.5, 0xf5f3ec);
buildChair(scene, terraceCenter.x - 3.5, terraceCenter.z + 1.3, Math.PI, 0x34506a);
buildChair(scene, terraceCenter.x - 3.5, terraceCenter.z - 0.3, 0, 0x34506a);
buildChair(scene, terraceCenter.x - 4.3, terraceCenter.z + 0.5, -Math.PI / 2, 0x34506a);

buildTable(scene, terraceCenter.x + 3.5, terraceCenter.z + 0.3, 0xf5f3ec);
buildChair(scene, terraceCenter.x + 3.5, terraceCenter.z + 1.1, Math.PI, 0x34506a);
buildChair(scene, terraceCenter.x + 3.5, terraceCenter.z - 0.5, 0, 0x34506a);

buildTable(scene, terraceCenter.x, terraceCenter.z + 1.6, 0xf5f3ec);
buildChair(scene, terraceCenter.x - 0.8, terraceCenter.z + 1.6, -Math.PI / 2, 0x34506a);
buildChair(scene, terraceCenter.x + 0.8, terraceCenter.z + 1.6, Math.PI / 2, 0x34506a);

// Parasols dotted around the terrace edge and between courts and terrace.
buildUmbrella(scene, terraceCenter.x - 6.5, terraceCenter.z + 1, 0x2f6fb0);
buildUmbrella(scene, terraceCenter.x + 6.5, terraceCenter.z + 1, 0x2f6fb0);
buildUmbrella(scene, terraceCenter.x - 10, terraceCenter.z - 3, 0x2f6fb0);
buildUmbrella(scene, terraceCenter.x + 10, terraceCenter.z - 3, 0x2f6fb0);

// Benches along the walkway between terrace and courts.
const walkZ = halfBlockZ + 4;
buildBench(scene, -14, walkZ, 0);
buildBench(scene, 14, walkZ, 0);
buildBench(scene, 0, walkZ + 2, Math.PI);

// Hedges framing the terrace / lawn (like the trimmed hedges in the photo).
buildHedge(scene, -9, terraceCenter.z - 2, 6, 0.7, 0.7);
buildHedge(scene, 9, terraceCenter.z - 2, 6, 0.7, 0.7);
buildHedge(scene, terraceCenter.x - 8.5, terraceCenter.z, 0.7, 5, 0.7);
buildHedge(scene, terraceCenter.x + 8.5, terraceCenter.z, 0.7, 5, 0.7);

// --- Forest ring ---
buildForest(scene, 440, 80, 235);

// --- Player ---
// Start seated-ish at the white table, looking toward the courts (-Z).
const startPos = new THREE.Vector3(startTablePos.x + 1.2, 0, startTablePos.z + 0.4);
const lookTarget = new THREE.Vector3(startTablePos.x, 0, startTablePos.z - 20);
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
  camera.position.set(x, 1.7, z);
  camera.rotation.set(0, yawDeg * Math.PI / 180, 0);
  player.setView?.(x, z, yawDeg);   // ab Task 6: hält yaw/pitch des Controllers synchron
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
