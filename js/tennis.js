import * as THREE from 'three';
import { addBox } from './collision.js';

// --- Regulation court dimensions (metres) ---
const COURT_L = 23.77;   // baseline to baseline (along local Z)
const COURT_W = 10.97;   // doubles width (along local X)
const SINGLES_W = 8.23;
const SERVICE_FROM_NET = 6.40;

// Fenced enclosure per court.
export const FENCE_W = 18;   // X
export const FENCE_D = 34;   // Z
const FENCE_H = 3.0;
const GATE_W = 2.2;          // opening in the fence

// Shared materials / textures (built once, reused across all 6 courts).
let _clayMat, _lineMat, _netMat;

function clayMaterial() {
  if (_clayMat) return _clayMat;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#b0532e';
  g.fillRect(0, 0, 256, 256);
  // speckle + faint horizontal broom sweep
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * 256, y = Math.random() * 256;
    const r = Math.random();
    if (r < 0.5) g.fillStyle = 'rgba(150,68,36,0.5)';
    else if (r < 0.8) g.fillStyle = 'rgba(196,102,60,0.5)';
    else g.fillStyle = 'rgba(120,52,28,0.45)';
    g.fillRect(x, y, 1.4, 1.4);
  }
  g.strokeStyle = 'rgba(140,64,34,0.25)';
  g.lineWidth = 1;
  for (let y = 0; y < 256; y += 4) {
    g.beginPath(); g.moveTo(0, y + Math.random() * 2); g.lineTo(256, y + Math.random() * 2); g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = 8;
  _clayMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 });
  return _clayMat;
}

function lineMaterial() {
  if (_lineMat) return _lineMat;
  const ppm = 24;                       // pixels per metre
  const pad = 0.6;                       // metre margin around court
  const W = Math.round((COURT_W + pad * 2) * ppm);
  const H = Math.round((COURT_L + pad * 2) * ppm);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.clearRect(0, 0, W, H);
  g.translate(W / 2, H / 2);           // origin at court centre
  g.strokeStyle = '#f4f4f0';
  g.lineWidth = Math.max(2, 0.05 * ppm);
  g.lineCap = 'square';

  const m = (v) => v * ppm;
  const dW = COURT_W / 2, sW = SINGLES_W / 2, hL = COURT_L / 2, svc = SERVICE_FROM_NET;

  const rect = (x, y, w, h) => g.strokeRect(m(x), m(y), m(w), m(h));
  const line = (x1, y1, x2, y2) => { g.beginPath(); g.moveTo(m(x1), m(y1)); g.lineTo(m(x2), m(y2)); g.stroke(); };

  // Doubles boundary
  rect(-dW, -hL, COURT_W, COURT_L);
  // Singles sidelines
  line(-sW, -hL, -sW, hL);
  line(sW, -hL, sW, hL);
  // Service lines
  line(-sW, -svc, sW, -svc);
  line(-sW, svc, sW, svc);
  // Centre service line
  line(0, -svc, 0, svc);
  // Centre marks on baselines
  line(0, -hL, 0, -hL + 0.3);
  line(0, hL, 0, hL - 0.3);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  _lineMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  _lineMat._planeW = COURT_W + pad * 2;
  _lineMat._planeH = COURT_L + pad * 2;
  return _lineMat;
}

function netMaterial() {
  if (_netMat) return _netMat;
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 64);
  // fine mesh
  g.strokeStyle = 'rgba(20,20,20,0.55)';
  g.lineWidth = 1;
  for (let x = 0; x <= 256; x += 5) { g.beginPath(); g.moveTo(x, 6); g.lineTo(x, 64); g.stroke(); }
  for (let y = 6; y <= 64; y += 5) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  // white top band
  g.fillStyle = '#f2f2ee';
  g.fillRect(0, 0, 256, 6);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(10, 1);
  _netMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, alphaTest: 0.05 });
  return _netMat;
}

/**
 * Build one fenced court centred at (cx, cz). Long axis runs along Z.
 * Registers fence colliders (with a gate gap on the +Z side).
 */
export function buildCourt(scene, cx, cz) {
  const group = new THREE.Group();
  group.position.set(cx, 0, cz);
  scene.add(group);

  // Clay surface (fills the enclosure).
  const clay = new THREE.Mesh(new THREE.PlaneGeometry(FENCE_W - 0.6, FENCE_D - 0.6), clayMaterial());
  clay.rotation.x = -Math.PI / 2;
  clay.position.y = 0.02;
  clay.receiveShadow = true;
  group.add(clay);

  // Court line markings.
  const lm = lineMaterial();
  const lines = new THREE.Mesh(new THREE.PlaneGeometry(lm._planeW, lm._planeH), lm);
  lines.rotation.x = -Math.PI / 2;
  lines.position.y = 0.035;
  group.add(lines);

  buildNet(group);
  buildFence(group);

  // Fence collision (four sides; +Z side split for a gate).
  const hw = FENCE_W / 2, hd = FENCE_D / 2;
  const gx = cx, gz = cz;
  addBox(gx - hw - 0.1, gz - hd - 0.1, gx + hw + 0.1, gz - hd + 0.1);        // back (-Z)
  addBox(gx - hw - 0.1, gz - hd, gx - hw + 0.1, gz + hd);                     // left (-X)
  addBox(gx + hw - 0.1, gz - hd, gx + hw + 0.1, gz + hd);                     // right (+X)
  // front (+Z) with gate opening in the middle
  addBox(gx - hw - 0.1, gz + hd - 0.1, gx - GATE_W / 2, gz + hd + 0.1);
  addBox(gx + GATE_W / 2, gz + hd - 0.1, gx + hw + 0.1, gz + hd + 0.1);

  return group;
}

function buildNet(group) {
  const halfLen = 6.4;   // net extends slightly past doubles sidelines
  const netH = 1.07;

  // Net fabric
  const net = new THREE.Mesh(new THREE.PlaneGeometry(halfLen * 2, netH), netMaterial());
  net.position.set(0, netH / 2, 0);
  group.add(net);

  // White tape reinforcement bottom
  const band = new THREE.Mesh(
    new THREE.PlaneGeometry(halfLen * 2, 0.05),
    new THREE.MeshBasicMaterial({ color: 0xf2f2ee, side: THREE.DoubleSide })
  );
  band.position.set(0, 0.03, 0.001);
  group.add(band);

  // Posts
  const postMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.6, metalness: 0.4 });
  for (const sx of [-halfLen, halfLen]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 10), postMat);
    post.position.set(sx, 0.6, 0);
    post.castShadow = true;
    group.add(post);
  }
  // Centre strap
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.05, netH, 0.02),
    new THREE.MeshBasicMaterial({ color: 0xf2f2ee }));
  strap.position.set(0, netH / 2, 0);
  group.add(strap);
}

function buildFence(group) {
  const hw = FENCE_W / 2, hd = FENCE_D / 2;
  const postMat = new THREE.MeshStandardMaterial({ color: 0x3a3f3a, roughness: 0.7, metalness: 0.3 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x2f6d42, roughness: 0.95, side: THREE.DoubleSide });
  // chain-link (upper) — faint, mostly transparent
  const linkMat = new THREE.MeshStandardMaterial({ color: 0x9aa39a, roughness: 0.8, metalness: 0.4, transparent: true, opacity: 0.18, side: THREE.DoubleSide });

  const screenH = 1.9;             // solid green windscreen height
  const buildSide = (x1, z1, x2, z2, gate) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2;
    const angle = Math.atan2(z2 - z1, x2 - x1);

    // green screen (lower)
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(len, screenH), screenMat);
    screen.position.set(mx, screenH / 2, mz);
    screen.rotation.y = -angle;
    group.add(screen);
    // link mesh (upper)
    const link = new THREE.Mesh(new THREE.PlaneGeometry(len, FENCE_H - screenH), linkMat);
    link.position.set(mx, screenH + (FENCE_H - screenH) / 2, mz);
    link.rotation.y = -angle;
    group.add(link);
  };

  buildSide(-hw, -hd, hw, -hd);   // back
  buildSide(-hw, -hd, -hw, hd);   // left
  buildSide(hw, -hd, hw, hd);     // right
  buildSide(-hw, hd, hw, hd);     // front (gate visually part of screen)

  // Fence posts around perimeter every ~4m
  const addPost = (x, z) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, FENCE_H, 8), postMat);
    p.position.set(x, FENCE_H / 2, z);
    p.castShadow = true;
    group.add(p);
  };
  for (let x = -hw; x <= hw + 0.01; x += 4.5) { addPost(x, -hd); addPost(x, hd); }
  for (let z = -hd; z <= hd + 0.01; z += 4.5) { addPost(-hw, z); addPost(hw, z); }
}

/**
 * A tall floodlight pole.
 */
export function buildFloodlight(scene, x, z, height = 12) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  const poleMat = new THREE.MeshStandardMaterial({ color: 0x8a8f95, roughness: 0.5, metalness: 0.7 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, height, 12), poleMat);
  pole.position.y = height / 2;
  pole.castShadow = true;
  g.add(pole);

  // Cross-arm + 2 lamp heads
  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.12), poleMat);
  arm.position.y = height - 0.2;
  g.add(arm);

  const lampMat = new THREE.MeshStandardMaterial({ color: 0xdfe6ee, roughness: 0.3, metalness: 0.6, emissive: 0x222222 });
  for (const dx of [-0.9, 0.9]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.28), lampMat);
    head.position.set(dx, height - 0.35, 0.2);
    head.rotation.x = 0.5;
    head.castShadow = true;
    g.add(head);
  }

  scene.add(g);
  addBox(x - 0.25, z - 0.25, x + 0.25, z + 0.25);
  return g;
}

/**
 * Lay out 6 courts in a 3 (X) × 2 (Z) block and add floodlights.
 * Returns useful extents so the caller can place the clubhouse etc.
 */
export function buildCourtBlock(scene) {
  const colGap = 2, rowGap = 2;
  const colStep = FENCE_W + colGap;   // 20
  const rowStep = FENCE_D + rowGap;   // 36
  const colX = [-colStep, 0, colStep];
  const rowZ = [-rowStep / 2, rowStep / 2];

  for (const z of rowZ) {
    for (const x of colX) {
      buildCourt(scene, x, z);
    }
  }

  // Floodlights along the outer long sides and central spine.
  const outerX = colStep + FENCE_W / 2 + 1.2;
  const spineZ = 0;
  buildFloodlight(scene, -outerX, -rowStep / 2, 12);
  buildFloodlight(scene, -outerX, rowStep / 2, 12);
  buildFloodlight(scene, outerX, -rowStep / 2, 12);
  buildFloodlight(scene, outerX, rowStep / 2, 12);
  buildFloodlight(scene, -colStep / 2, spineZ, 11);
  buildFloodlight(scene, colStep / 2, spineZ, 11);

  const halfBlockX = colStep + FENCE_W / 2;   // ~29
  const halfBlockZ = rowStep / 2 + FENCE_D / 2; // ~35
  return { halfBlockX, halfBlockZ };
}
