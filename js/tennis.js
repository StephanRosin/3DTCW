import * as THREE from 'three';
import { addBox } from './collision.js';
import { pbr } from './textures.js';

// --- Regulation court dimensions (metres) ---
const COURT_L = 23.77;   // baseline to baseline (along local Z)
const COURT_W = 10.97;   // doubles width (along local X)
const SINGLES_W = 8.23;
const SERVICE_FROM_NET = 6.40;

// --- Row layout: 6 courts side by side, sharing one enclosure ---
export const COURT_PITCH = 15.6;
export const ROW_COURTS = 6;
export const ENC = { minX: -48.8, maxX: 48.8, minZ: -18, maxZ: 18, h: 4 };

// Gate gaps in the north fence (world x, half-width 1.1 m each).
// -31.2: main access, between courts 1 and 2 (later gets a staircase from the raised terrace).
// +40: east access.
const GATE_W = 2.2;
const GATE_H = 2.2;
const GATE_X = [-31.2, 40];

// Shared materials / textures (built once, reused across all 6 courts).
let _lineMat, _netMat, _metalDark;

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

function metalDarkMaterial() {
  if (_metalDark) return _metalDark;
  _metalDark = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.5, metalness: 0.6 });
  return _metalDark;
}

/** Line markings + net for one court centred at world x = cx (net runs along X at z = 0). */
function addCourtMarkings(group, cx) {
  const lm = lineMaterial();
  const lines = new THREE.Mesh(new THREE.PlaneGeometry(lm._planeW, lm._planeH), lm);
  lines.rotation.x = -Math.PI / 2;
  lines.position.set(cx, 0.035, 0);
  group.add(lines);

  addNet(group, cx);
}

function addNet(group, cx) {
  const halfLen = 6.4;   // net extends slightly past doubles sidelines
  const netH = 1.07;

  // Net fabric
  const net = new THREE.Mesh(new THREE.PlaneGeometry(halfLen * 2, netH), netMaterial());
  net.position.set(cx, netH / 2, 0);
  group.add(net);

  // White tape reinforcement bottom
  const band = new THREE.Mesh(
    new THREE.PlaneGeometry(halfLen * 2, 0.05),
    new THREE.MeshBasicMaterial({ color: 0xf2f2ee, side: THREE.DoubleSide })
  );
  band.position.set(cx, 0.03, 0.001);
  group.add(band);

  // Posts
  const postMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.6, metalness: 0.4 });
  for (const sx of [-halfLen, halfLen]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 10), postMat);
    post.position.set(cx + sx, 0.6, 0);
    post.castShadow = true;
    group.add(post);
  }
  // Centre strap
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.05, netH, 0.02),
    new THREE.MeshBasicMaterial({ color: 0xf2f2ee }));
  strap.position.set(cx, netH / 2, 0);
  group.add(strap);
}

/** Visual door frame (uprights + lintel) marking a gate opening in the fence. */
function buildGateFrame(group, x, z, width, height) {
  const mat = metalDarkMaterial();
  const postW = 0.08;
  for (const dx of [-width / 2, width / 2]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(postW, height, postW), mat);
    post.position.set(x + dx, height / 2, z);
    post.castShadow = true;
    group.add(post);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(width + postW, postW, postW), mat);
  lintel.position.set(x, height, z);
  group.add(lintel);
}

/**
 * Shared perimeter fence around the whole enclosure (windscreen + chain-link).
 * North side is built as three segments so the two gate openings are visually open.
 */
function buildEnclosureFence(group) {
  const { minX, maxX, minZ, maxZ, h } = ENC;
  const screenH = 2.2;
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x2f6d42, roughness: 0.95, side: THREE.DoubleSide });
  const linkMat = new THREE.MeshStandardMaterial({ color: 0x9aa39a, roughness: 0.8, metalness: 0.4, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x3a3f3a, roughness: 0.7, metalness: 0.3 });

  // `withScreen = false` → chain-link only, full height (used on the north/clubhouse
  // side so the courts stay visible from the terrace — no green windscreen there).
  const buildSide = (x1, z1, x2, z2, withScreen = true) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    if (len <= 0.01) return;
    const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2;
    const angle = Math.atan2(z2 - z1, x2 - x1);

    if (withScreen) {
      // green windscreen (lower)
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(len, screenH), screenMat);
      screen.position.set(mx, screenH / 2, mz);
      screen.rotation.y = -angle;
      group.add(screen);
      // chain-link (upper)
      const link = new THREE.Mesh(new THREE.PlaneGeometry(len, h - screenH), linkMat);
      link.position.set(mx, screenH + (h - screenH) / 2, mz);
      link.rotation.y = -angle;
      group.add(link);
    } else {
      // chain-link only, full height — courts stay visible from this side.
      const link = new THREE.Mesh(new THREE.PlaneGeometry(len, h), linkMat);
      link.position.set(mx, h / 2, mz);
      link.rotation.y = -angle;
      group.add(link);
    }

    // Posts every ~4 m along the segment.
    const postStep = 4;
    const n = Math.max(1, Math.round(len / postStep));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const px = x1 + (x2 - x1) * t, pz = z1 + (z2 - z1) * t;
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, h, 8), postMat);
      p.position.set(px, h / 2, pz);
      p.castShadow = true;
      group.add(p);
    }
  };

  // South, west, east — full, unbroken sides with windscreen + chain-link.
  buildSide(minX, maxZ, maxX, maxZ);   // south
  buildSide(minX, minZ, minX, maxZ);   // west
  buildSide(maxX, minZ, maxX, maxZ);   // east

  // North (clubhouse side) — chain-link only, three segments open at the two gates.
  buildSide(minX, minZ, GATE_X[0] - GATE_W / 2, minZ, false);
  buildSide(GATE_X[0] + GATE_W / 2, minZ, GATE_X[1] - GATE_W / 2, minZ, false);
  buildSide(GATE_X[1] + GATE_W / 2, minZ, maxX, minZ, false);

  for (const gx of GATE_X) buildGateFrame(group, gx, minZ, GATE_W, GATE_H);
}

/** Perimeter collision boxes, with two 2.2 m gate gaps in the north side. */
function addFenceColliders() {
  const { minX, maxX, minZ, maxZ } = ENC;

  addBox(minX - 0.1, maxZ - 0.1, maxX + 0.1, maxZ + 0.1);   // south
  addBox(minX - 0.1, minZ - 0.1, minX + 0.1, maxZ + 0.1);   // west
  addBox(maxX - 0.1, minZ - 0.1, maxX + 0.1, maxZ + 0.1);   // east

  // north, split into 3 segments around the gate gaps
  addBox(minX - 0.1, minZ - 0.1, GATE_X[0] - GATE_W / 2, minZ + 0.1);
  addBox(GATE_X[0] + GATE_W / 2, minZ - 0.1, GATE_X[1] - GATE_W / 2, minZ + 0.1);
  addBox(GATE_X[1] + GATE_W / 2, minZ - 0.1, maxX + 0.1, minZ + 0.1);
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
 * Build a single row of 6 courts sharing one enclosure (matches the real facility's
 * aerial layout): one continuous clay surface, per-court line markings + nets,
 * a shared perimeter fence with two north-side gate gaps, and 6 floodlight masts.
 */
export function buildCourtRow(scene) {
  const group = new THREE.Group();
  scene.add(group);

  // One continuous sand surface across the whole enclosure (as seen in the aerial photos).
  const clay = new THREE.Mesh(
    new THREE.PlaneGeometry(ENC.maxX - ENC.minX, ENC.maxZ - ENC.minZ),
    pbr({ dir: 'assets/textures/clay', color: 0xb0532e, repeat: [24, 9] }));
  clay.rotation.x = -Math.PI / 2;
  clay.position.y = 0.02;
  clay.receiveShadow = true;
  group.add(clay);

  const courtX = [];
  for (let i = 0; i < ROW_COURTS; i++) {
    const cx = (i - (ROW_COURTS - 1) / 2) * COURT_PITCH;
    courtX.push(cx);
    addCourtMarkings(group, cx);
  }

  buildEnclosureFence(group);
  addFenceColliders();

  // North line: only 2 masts, offset from the centre gate at x = -31.2.
  for (const x of [-COURT_PITCH, COURT_PITCH]) {
    buildFloodlight(scene, x, ENC.minZ - 0.8, 14);
  }
  // South line: 3 masts.
  for (const x of [-COURT_PITCH * 2, 0, COURT_PITCH * 2]) {
    buildFloodlight(scene, x, ENC.maxZ + 0.8, 14);
  }

  return { courtX };
}
