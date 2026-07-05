import * as THREE from 'three';
import { addBox, PLATEAU, RAMPS, groundHeight } from './collision.js';
import { pbr, loadTex } from './textures.js';

export const wood = (c = 0x8a5a33) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0 });
export const metalDark = new THREE.MeshStandardMaterial({ color: 0x2b2f33, roughness: 0.5, metalness: 0.6 });

/** A simple café table (round top on a stem). Returns world position of the top. `r` is the tabletop radius. */
export function buildTable(scene, x, z, color = 0xf3f1ea, y = 0, r = 0.42) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const topMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.05, 24), topMat);
  top.position.y = 0.72; top.castShadow = true; g.add(top);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.72, 10), metalDark);
  stem.position.y = 0.36; g.add(stem);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.67, r * 0.71, 0.04, 14), metalDark);
  foot.position.y = 0.02; g.add(foot);
  scene.add(g);
  addBox(x - r, z - r, x + r, z + r);
  return new THREE.Vector3(x, y + 0.72, z);
}

/** A rectangular café table (wood top on 4 legs). `w` = X extent, `d` = Z extent. */
export function buildRectTable(scene, x, z, w = 0.8, d = 1.6, color = 0xf3f1ea, y = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const topMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), topMat);
  top.position.y = 0.72; top.castShadow = true; g.add(top);
  const legH = 0.72, inset = 0.08;
  for (const [lx, lz] of [
    [-w / 2 + inset, -d / 2 + inset], [w / 2 - inset, -d / 2 + inset],
    [-w / 2 + inset, d / 2 - inset], [w / 2 - inset, d / 2 - inset],
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, legH, 8), metalDark);
    leg.position.set(lx, legH / 2, lz); leg.castShadow = true; g.add(leg);
  }
  scene.add(g);
  addBox(x - w / 2, z - d / 2, x + w / 2, z + d / 2);
  return new THREE.Vector3(x, y + 0.72, z);
}

/** A simple chair. */
export function buildChair(scene, x, z, rotY = 0, color = 0x3a4a5a, y = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.44), mat);
  seat.position.y = 0.46; seat.castShadow = true; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.05), mat);
  back.position.set(0, 0.68, -0.2); g.add(back);
  const legMat = metalDark;
  for (const [lx, lz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.46, 6), legMat);
    leg.position.set(lx, 0.23, lz); g.add(leg);
  }
  scene.add(g);
}

/** A parasol / umbrella. */
export function buildUmbrella(scene, x, z, color = 0x2f6fb0, y = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.3, 10), wood(0x6b6b6b));
  pole.position.y = 1.15; g.add(pole);
  // Rounded canopy: a shallow polar cap of a sphere (dome), replacing the old cone shape.
  const canopyR = 1.6;
  const canopyBaseY = 1.8;
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(canopyR, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2.6),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8, side: THREE.DoubleSide })
  );
  canopy.position.y = canopyBaseY; canopy.castShadow = true; g.add(canopy);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), wood(0x555555));
  cap.position.y = canopyBaseY + canopyR + 0.05; g.add(cap);
  scene.add(g);
  addBox(x - 0.12, z - 0.12, x + 0.12, z + 0.12);
}

/**
 * A large parasol (scaled-up variant of buildUmbrella) for the round table:
 * canopy radius ~2.2, rim height ~3.2 above the terrace floor so players
 * can walk under it. Only the pole gets a (small) collider.
 */
export function buildBigUmbrella(scene, x, z, color = 0xc03030, y = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const canopyR = 2.2;
  const thetaLength = Math.PI / 2.6;
  // Rim (bottom edge of the spherical-cap canopy) sits at canopyBaseY +
  // canopyR*cos(thetaLength); solved so the rim lands at ~3.2 m.
  const rimY = 3.2;
  const canopyBaseY = rimY - canopyR * Math.cos(thetaLength);
  const poleH = canopyBaseY + 0.5;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, poleH, 10), wood(0x6b6b6b));
  pole.position.y = poleH / 2; g.add(pole);
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(canopyR, 16, 8, 0, Math.PI * 2, 0, thetaLength),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8, side: THREE.DoubleSide })
  );
  canopy.position.y = canopyBaseY; canopy.castShadow = true; g.add(canopy);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), wood(0x555555));
  cap.position.y = canopyBaseY + canopyR + 0.06; g.add(cap);
  scene.add(g);
  addBox(x - 0.15, z - 0.15, x + 0.15, z + 0.15);   // pole-only collider
}

/** A wooden bench. */
export function buildBench(scene, x, z, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  const m = wood(0x9a6a3f);
  for (let i = 0; i < 3; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.12), m);
    slat.position.set(0, 0.45, -0.18 + i * 0.16); slat.castShadow = true; g.add(slat);
  }
  for (let i = 0; i < 2; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.06), m);
    slat.position.set(0, 0.62 + i * 0.16, -0.24); g.add(slat);
  }
  for (const lx of [-0.8, 0.8]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.4), wood(0x6f4a2a));
    leg.position.set(lx, 0.225, -0.1); g.add(leg);
  }
  scene.add(g);
  addBox(x - 0.9, z - 0.3, x + 0.9, z + 0.3);
}

/** A backless wooden bench (seat slats + legs only, no backrest). */
export function buildBenchBackless(scene, x, z, rotY = 0, y = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  const m = wood(0x9a6a3f);
  for (let i = 0; i < 3; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.12), m);
    slat.position.set(0, 0.45, -0.18 + i * 0.16); slat.castShadow = true; g.add(slat);
  }
  for (const lx of [-0.8, 0.8]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.4), wood(0x6f4a2a));
    leg.position.set(lx, 0.225, -0.1); g.add(leg);
  }
  scene.add(g);
  // Local footprint half-extents (X=0.9, Z=0.3) rotated by rotY into an axis-aligned box.
  const halfX = Math.abs(0.9 * Math.cos(rotY)) + Math.abs(0.3 * Math.sin(rotY));
  const halfZ = Math.abs(0.9 * Math.sin(rotY)) + Math.abs(0.3 * Math.cos(rotY));
  addBox(x - halfX, z - halfZ, x + halfX, z + halfZ);
}

/** A trimmed hedge (box). */
export function buildHedge(scene, x, z, w, d, h = 0.8, y = 0) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x3d6b2e, roughness: 1 });
  const hedge = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  hedge.position.set(x, y + h / 2, z);
  hedge.castShadow = true; hedge.receiveShadow = true;
  scene.add(hedge);
  addBox(x - w / 2, z - d / 2, x + w / 2, z + d / 2);
}

/**
 * The raised terrace plateau north of the courts (deepened): a solid
 * platform (+1.5 m) carrying the clubhouse, entrance portal and terrace
 * furniture. Its south edge has a concrete retaining wall with a low hedge
 * on top, except in the RAMPS X-range where sitting steps (grandstand)
 * lead down to ground level — the walkable ramp aligned with the west
 * north-fence gate; `groundHeight()` in collision.js provides the smooth Y
 * ramp players actually walk on. The plateau is bounded on the west, north
 * and east by thin colliders (forest side / clubhouse back / court-side
 * retaining wall); the south edge is either the ramp or the retaining wall.
 */
export function buildTerracePlateau(scene) {
  const p = PLATEAU;
  const deckH = p.h;                 // 1.5
  const cx = (p.minX + p.maxX) / 2;
  const cz = (p.minZ + p.maxZ) / 2;
  const width = p.maxX - p.minX;
  const depth = p.maxZ - p.minZ;

  // --- Top deck: paving over the whole plateau -----------------------------
  const pavingTop = pbr({ dir: 'assets/textures/paving', color: 0xb7b0a0, repeat: [18, 9], roughness: 0.95 });
  const concreteSide = pbr({ dir: 'assets/textures/concrete', color: 0x9a958c, repeat: [20, 1.5], roughness: 0.9 });

  const deckGeo = new THREE.BoxGeometry(width, deckH, depth);
  // Face order: +x, -x, +y (top), -y (bottom), +z, -z
  const deck = new THREE.Mesh(deckGeo, [concreteSide, concreteSide, pavingTop, concreteSide, concreteSide, concreteSide]);
  deck.position.set(cx, deckH / 2, cz);
  deck.castShadow = true; deck.receiveShadow = true;
  scene.add(deck);

  // --- South retaining wall + hedge, skipping the ramp X-range -------------
  const ramps = [...RAMPS].sort((a, b) => a.minX - b.minX);
  const wallSegments = [];
  let cursor = p.minX;
  for (const r of ramps) {
    if (r.minX > cursor) wallSegments.push({ minX: cursor, maxX: r.minX });
    cursor = Math.max(cursor, r.maxX);
  }
  if (cursor < p.maxX) wallSegments.push({ minX: cursor, maxX: p.maxX });

  const wallMat = pbr({ dir: 'assets/textures/concrete', color: 0x9a958c, repeat: [8, 1], roughness: 0.9 });
  const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x3d6b2e, roughness: 1 });
  const wallThickness = 0.3, hedgeH = 0.5, hedgeDepth = 0.5;

  for (const seg of wallSegments) {
    const w = seg.maxX - seg.minX;
    const segCx = (seg.minX + seg.maxX) / 2;

    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, deckH, wallThickness), wallMat);
    wall.position.set(segCx, deckH / 2, p.maxZ);
    wall.castShadow = true; wall.receiveShadow = true;
    scene.add(wall);

    const hedge = new THREE.Mesh(new THREE.BoxGeometry(w, hedgeH, hedgeDepth), hedgeMat);
    hedge.position.set(segCx, deckH + hedgeH / 2, p.maxZ);
    hedge.castShadow = true; hedge.receiveShadow = true;
    scene.add(hedge);

    // Thin collider along the south edge/railing (fixed sliver: hugs p.maxZ).
    addBox(seg.minX, p.maxZ - 0.3, seg.maxX, p.maxZ + 0.15);
  }

  // --- East retaining wall (plateau's east edge, facing the courts) ------
  const eastWallH = 1.5;
  const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, eastWallH, depth), wallMat);
  eastWall.position.set(p.maxX, eastWallH / 2, cz);
  eastWall.castShadow = true; eastWall.receiveShadow = true;
  scene.add(eastWall);
  addBox(p.maxX - 0.3, p.minZ, p.maxX + 0.35, p.maxZ);

  const eastHedge = new THREE.Mesh(new THREE.BoxGeometry(0.5, hedgeH, depth), hedgeMat);
  eastHedge.position.set(p.maxX, eastWallH + hedgeH / 2, cz);
  eastHedge.castShadow = true; eastHedge.receiveShadow = true;
  scene.add(eastHedge);

  // West / north edge colliders (forest side / clubhouse-back side stay solid boundaries).
  addBox(p.minX - 0.3, p.minZ, p.minX + 0.3, p.maxZ);
  addBox(p.minX, p.minZ - 0.3, p.maxX, p.minZ + 0.3);

  // --- Sitting steps (tribune) in the single RAMPS zone --------------------
  const woodMat = pbr({ dir: 'assets/textures/wood', color: 0x8a5a33, repeat: [6, 1], roughness: 0.85 });
  const stepHeights = [1.375, 1.125, 0.875, 0.625, 0.375, 0.125];
  const stepDepth = 0.4, stepH = 0.25;

  for (const ramp of RAMPS) {
    const w = ramp.maxX - ramp.minX;
    const rampCx = (ramp.minX + ramp.maxX) / 2;
    stepHeights.forEach((topY, i) => {
      const stepZ = p.maxZ + stepDepth / 2 + i * stepDepth;  // -20.8, -20.4, ..., -18.8
      const step = new THREE.Mesh(new THREE.BoxGeometry(w, stepH, stepDepth), woodMat);
      step.position.set(rampCx, topY - stepH / 2, stepZ);
      step.castShadow = true; step.receiveShadow = true;
      scene.add(step);
    });
  }
}

/**
 * A slatted wooden pergola with hanging vine greenery, built as a group so
 * it can be dropped onto the plateau (`y` = base offset, e.g. PLATEAU.h).
 */
function buildPergola(scene, cx, cz, w, d, y = 0) {
  const g = new THREE.Group();
  g.position.set(cx, y, cz);
  scene.add(g);

  const postMat = wood(0x8a5a33);
  const beamMat = wood(0x9a6a40);
  const vineMat = new THREE.MeshStandardMaterial({ color: 0x2e5c28, roughness: 1, flatShading: true });
  const hw = w / 2, hd = d / 2, top = 2.6;

  // Corner + mid posts (world-space colliders; the meshes hang off the group).
  const postXZ = [];
  for (const px of [-hw, 0, hw]) {
    for (const pz of [-hd, hd]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, top, 10), postMat);
      post.position.set(px, top / 2, pz);
      post.castShadow = true; g.add(post);
      addBox(cx + px - 0.15, cz + pz - 0.15, cx + px + 0.15, cz + pz + 0.15);
      postXZ.push([px, pz]);
    }
  }
  // Perimeter beams (long axis)
  for (const pz of [-hd, hd]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, 0.14), beamMat);
    beam.position.set(0, top, pz); beam.castShadow = true; g.add(beam);
  }
  // Cross slats
  const n = Math.floor(w / 0.5);
  for (let i = 0; i <= n; i++) {
    const x = -hw + (i / n) * w;
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, d + 0.2), beamMat);
    slat.position.set(x, top + 0.08, 0); g.add(slat);
  }

  // Vine greenery: a leafy cluster at each post head...
  for (const [px, pz] of postXZ) {
    const cluster = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), vineMat);
    cluster.position.set(px, top + 0.12, pz);
    cluster.castShadow = true; g.add(cluster);
  }
  // ...plus flattened leaf blobs draped along the top slats.
  const vineCount = 9;
  for (let i = 0; i < vineCount; i++) {
    const t = i / (vineCount - 1);
    const x = -hw + t * w;
    const pz = (i % 2 === 0 ? -hd * 0.55 : hd * 0.55);
    const blob = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), vineMat);
    blob.scale.y = 0.4;
    blob.position.set(x, top + 0.22, pz);
    g.add(blob);
  }
  return g;
}

/**
 * A simple wooden railing (posts + 2 rails) with a thin collider behind it —
 * used as the barrier at the plateau's north edge, behind the clubhouse.
 */
function buildRailing(scene, minX, maxX, z, baseY) {
  const postMat = wood(0x6b4a2e);
  const railMat = wood(0x8a5a33);
  const span = maxX - minX;
  const n = Math.max(1, Math.round(span / 3));
  const railH = 1.0;

  for (let i = 0; i <= n; i++) {
    const x = minX + (i / n) * span;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, railH, 8), postMat);
    post.position.set(x, baseY + railH / 2, z);
    post.castShadow = true; scene.add(post);
  }
  for (const ry of [0.5, 1.0]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(span, 0.08, 0.08), railMat);
    rail.position.set((minX + maxX) / 2, baseY + ry, z);
    scene.add(rail);
  }
  addBox(minX, z - 0.3, maxX, z + 0.3);
}

/**
 * Shared shell for the two long terrace-side buildings (clubhouse and
 * restaurant): a 42x7 m dark wood-slat block with a flat overhanging roof
 * and a white window band + glass insets on the south (court-facing)
 * facade. `opts.signage(scene, cx, baseY, southZ)` adds whatever goes on
 * the facade beyond the window band (a logo rondell, a sign board, ...).
 * Returns the footprint so the caller can add its own furniture/terrace.
 */
function buildLongBuilding(scene, cx, cz, { signage } = {}) {
  const p = PLATEAU;
  const baseY = p.h;   // 1.5 — plateau top
  const bw = 42, bd = 7, bh = 3.6;
  const southZ = cz + bd / 2;   // facing the courts, +Z
  const northZ = cz - bd / 2;   // back of the building

  // Note: the wood diff.jpg texture already carries a dark-brown photographic
  // colour, so the tint here must stay light (it multiplies the texture,
  // not replace it) — 0x4a3826 previously double-darkened the facade to
  // near-black under normal daylight; 0xb0925f keeps a "dark wood-slat" look
  // while still reading clearly.
  const facadeMat = pbr({ dir: 'assets/textures/wood', color: 0xb0925f, repeat: [8, 1.5], roughness: 0.85 });
  const building = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), facadeMat);
  building.position.set(cx, baseY + bh / 2, cz);
  building.castShadow = true; building.receiveShadow = true;
  scene.add(building);
  addBox(cx - bw / 2, northZ, cx + bw / 2, southZ);

  // Flat overhanging roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(bw + 1, 0.25, bd + 1),
    new THREE.MeshStandardMaterial({ color: 0x3c3630, roughness: 0.8 }));
  roof.position.set(cx, 5.2, cz);
  roof.castShadow = true; scene.add(roof);

  // White window band along the south facade (local y 1.6..2.6 -> world 3.1..4.1)
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xf4f2ec, roughness: 0.6, emissive: 0x2a281f, emissiveIntensity: 0.12 });
  const band = new THREE.Mesh(new THREE.PlaneGeometry(38, 1.0), bandMat);
  band.position.set(cx, baseY + 2.1, southZ + 0.02);
  scene.add(band);

  // Darker glass insets over the band
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x6fa0c8, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.65 });
  const insetCount = 7, insetW = 3.6, bandW = 38;
  for (let i = 0; i < insetCount; i++) {
    const t = (i + 0.5) / insetCount - 0.5;
    const inset = new THREE.Mesh(new THREE.PlaneGeometry(insetW, 0.8), glassMat);
    inset.position.set(cx + t * bandW, baseY + 2.1, southZ + 0.03);
    scene.add(inset);
  }

  signage?.(scene, cx, baseY, southZ);

  return { bw, bd, bh, baseY, southZ, northZ };
}

/** Draws `text` onto a canvas texture — same recipe as the fence sponsor banners. */
function signTexture(text, { bg = '#26313a', fg = '#ffffff', fontSize = 110 } = {}) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 1024, 256);
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 6; g.strokeRect(8, 8, 1008, 240);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${fontSize}px Arial`; g.fillText(text, 512, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/**
 * The clubhouse: the shared long-building shell set back at the north edge
 * of the deepened terrace plateau, with a TCW logo rondell on the south
 * facade, a vine-covered pergola over the open terrace, café furniture,
 * stair-mouth planters, and a wooden barrier along the plateau's back
 * (north) edge.
 */
export function buildClubhouse(scene) {
  const p = PLATEAU;
  const bx = -23.4, bz = -39.5;

  const { baseY } = buildLongBuilding(scene, bx, bz, {
    signage: (scene, cx, baseY, southZ) => {
      // TCW logo rondell on the south facade (faces +Z toward the courts, no
      // rotation needed) — true colours, no tinting/transparency.
      const logoMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
      logoMat.map = loadTex('assets/logos/tcw-logo.jpg', {
        srgb: true,
        onError: () => { logoMat.map = null; logoMat.color.set(0x26418f); logoMat.needsUpdate = true; },
      });
      const logo = new THREE.Mesh(new THREE.CircleGeometry(0.7, 32), logoMat);
      logo.position.set(cx, baseY + 1.9, southZ + 0.06);
      scene.add(logo);
    },
  });

  // --- Pergola over the 4 rect tables (see below) -----------------------
  buildPergola(scene, -21, -30, 15, 4.5, baseY);

  // --- Terrace furniture, laid out per the TCWLayout2 sketch --------------
  const chairColor = 0x3a4a5a;

  // Bar, NE corner against the clubhouse front: a walk-in niche. The bar
  // wall stands full clubhouse height (dark wood-slat facade, matching the
  // building) and hides the counter + fridges from the terrace; staff walk
  // in from a clear aisle behind the equipment (between it and the
  // clubhouse front at z=-36) rather than serving over the wall.
  {
    const wallMinX = -19, wallMaxX = -12.4;
    const wallW = wallMaxX - wallMinX, wallCx = (wallMinX + wallMaxX) / 2;
    const wallZ = -33.8, wallH = 3.6, wallThickness = 0.12;
    const barWallMat = pbr({ dir: 'assets/textures/wood', color: 0xb0925f, repeat: [2, 1.5], roughness: 0.85 });
    const barWall = new THREE.Mesh(new THREE.BoxGeometry(wallW, wallH, wallThickness), barWallMat);
    barWall.position.set(wallCx, baseY + wallH / 2, wallZ);
    barWall.castShadow = true; barWall.receiveShadow = true;
    scene.add(barWall);
    addBox(wallMinX, wallZ - 0.1, wallMaxX, wallZ + 0.1);

    // Equipment (counter + fridges) hugs the wall's north face; a ~1.4 m
    // aisle stays clear between the equipment and the clubhouse front.
    const equipZ = wallZ - wallThickness / 2 - 0.35;   // -34.21, depth-0.7 centred against the wall face

    const counterMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.35, metalness: 0.85 });
    const counterW = 5, counterD = 0.65, counterH = 0.9;
    // Shifted 1.4 m west of the wall's own centre (was -15) so the spare
    // room the fridges need is now on the EAST end of the counter instead
    // of the west end — this is what makes the tap/fridge swap below fit
    // inside the wall footprint (wallMinX -19..wallMaxX -12.4) without the
    // fridges poking out past the wall into the arch passage.
    const counterCx = -16.4;
    const counter = new THREE.Mesh(new THREE.BoxGeometry(counterW, counterH, counterD), counterMat);
    counter.position.set(counterCx, baseY + counterH / 2, equipZ);
    counter.castShadow = true; counter.receiveShadow = true;
    scene.add(counter);
    addBox(counterCx - counterW / 2, equipZ - counterD / 2, counterCx + counterW / 2, equipZ + counterD / 2);

    // Beer tap — chrome column + angled spout + drip tray, west third of the
    // counter, spout overhanging the aisle (north) side.
    const tapX = counterCx - counterW / 2 + counterW / 6;
    const tapMat = new THREE.MeshStandardMaterial({ color: 0xd7dbe0, roughness: 0.15, metalness: 0.95 });
    const tapZ = equipZ - counterD / 2 + 0.08;
    const tapBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.04, 12), tapMat);
    tapBase.position.set(tapX, baseY + counterH + 0.02, tapZ);
    scene.add(tapBase);
    const tapCol = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 10), tapMat);
    tapCol.position.set(tapX, baseY + counterH + 0.165, tapZ);
    scene.add(tapCol);
    const tapHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.18, 8), tapMat);
    tapHandle.position.set(tapX, baseY + counterH + 0.31, tapZ - 0.05);
    tapHandle.rotation.x = -Math.PI / 3;
    scene.add(tapHandle);
    const drip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.1), metalDark);
    drip.position.set(tapX, baseY + counterH + 0.01, tapZ - 0.06);
    scene.add(drip);

    // 2 fridges beside the counter (east end), hugging the same wall face;
    // fronts face the aisle (north) so staff can load them from behind.
    const fridgeMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e4, roughness: 0.4, metalness: 0.2 });
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xd0d0cc, roughness: 0.3, metalness: 0.3 });
    const fridgeW = 0.7, fridgeD = 0.7, fridgeH = 1.8;
    for (const fx of [counterCx + counterW / 2 + fridgeW / 2, counterCx + counterW / 2 + fridgeW * 1.5]) {
      const fridge = new THREE.Mesh(new THREE.BoxGeometry(fridgeW, fridgeH, fridgeD), fridgeMat);
      fridge.position.set(fx, baseY + fridgeH / 2, equipZ);
      fridge.castShadow = true; fridge.receiveShadow = true;
      scene.add(fridge);
      const door = new THREE.Mesh(new THREE.PlaneGeometry(fridgeW - 0.08, fridgeH - 0.1), doorMat);
      door.position.set(fx, baseY + fridgeH / 2, equipZ - fridgeD / 2 - 0.01);
      door.rotation.y = Math.PI;
      scene.add(door);
      addBox(fx - fridgeW / 2, equipZ - fridgeD / 2, fx + fridgeW / 2, equipZ + fridgeD / 2);
    }
  }

  // 4 rectangular tables (1.6 x 0.8, long axis along Z) in a row, 2 chairs
  // on each long side (east + west), all facing the table.
  for (const tx of [-15, -19, -23, -27]) {
    buildRectTable(scene, tx, -30, 0.8, 1.6, 0xf3f1ea, baseY);
    for (const tz of [-30.45, -29.55]) {
      buildChair(scene, tx - 0.7, tz, Math.PI / 2, chairColor, baseY);   // west side, faces east
      buildChair(scene, tx + 0.7, tz, -Math.PI / 2, chairColor, baseY);  // east side, faces west
    }
  }

  // 1 round table (r ~0.8) with 6 chairs arranged radially around it, under
  // a large parasol (pole offset 1.1 m west of the table centre so it reads
  // naturally and clears both the table and the chairs).
  {
    const rx = -38, rz = -31, tableR = 0.8, chairDist = tableR + 0.55;
    buildTable(scene, rx, rz, 0xf3f1ea, baseY, tableR);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const cxp = rx + Math.sin(a) * chairDist;
      const czp = rz + Math.cos(a) * chairDist;
      buildChair(scene, cxp, czp, a + Math.PI, chairColor, baseY);   // faces back toward the table centre
    }
    buildBigUmbrella(scene, rx - 1.1, rz, 0xc03030, baseY);
  }

  // Planter hedges flanking the stair mouth
  buildHedge(scene, -34.5, -21.8, 2.5, 0.8, 0.5, baseY);
  buildHedge(scene, -27.9, -21.8, 2.5, 0.8, 0.5, baseY);

  // --- Barrier behind the clubhouse (plateau north edge; spans the whole
  // terrace width, so it is only built once here, not again for the
  // restaurant building to its east). -----------------------------------
  buildRailing(scene, p.minX, p.maxX, -44, baseY);
}

/**
 * The restaurant: a second long building spanning courts 4-6 (mirrored
 * east of the clubhouse), the shared long-building shell with a
 * "TESSIN GROTTO" sign board instead of the TCW rondell, and a restaurant
 * terrace of tables/chairs/umbrellas in front of it. A low concrete wall
 * (with a plaza-side gap) separates the terrace from the walkway that
 * passes it on the courts side, so furniture stays north of z=-26.5.
 */
export function buildRestaurant(scene) {
  const bx = 23.4, bz = -39.5;

  const { baseY } = buildLongBuilding(scene, bx, bz, {
    signage: (scene, cx, baseY, southZ) => {
      const signMat = new THREE.MeshBasicMaterial({ map: signTexture('TESSIN GROTTO', { fontSize: 78 }), side: THREE.FrontSide });
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.8), signMat);
      sign.position.set(cx, baseY + 2.8, southZ + 0.06);
      scene.add(sign);
    },
  });

  // Low wall (Mäuerchen) separating the Grotto terrace from the walkway
  // that runs past it on the courts side, x 12..44 (a 2 m gap at x 10..12
  // is the terrace's own entrance from the plaza side — no wall there).
  {
    const mCx = (12 + 44) / 2, mW = 44 - 12, mH = 0.8, mThick = 0.25, mZ = -26;
    const mMat = pbr({ dir: 'assets/textures/concrete', color: 0x9a958c, repeat: [6, 1], roughness: 0.9 });
    const mauerchen = new THREE.Mesh(new THREE.BoxGeometry(mW, mH, mThick), mMat);
    mauerchen.position.set(mCx, baseY + mH / 2, mZ);
    mauerchen.castShadow = true; mauerchen.receiveShadow = true;
    scene.add(mauerchen);
    addBox(12, mZ - mThick / 2, 44, mZ + mThick / 2);
  }

  // Restaurant terrace (x 10..40): 8 table groups + 4 red umbrellas, all
  // north of z=-26.5 so nothing pokes past the Mäuerchen into the walkway.
  const chairColor = 0x3a4a5a;
  const northRowZ = -33, southRowZ = -27.3;
  const cols = [14, 20, 27, 34];

  for (const x of cols) {
    for (const z of [northRowZ, southRowZ]) {
      buildTable(scene, x, z, 0xf3f1ea, baseY);
      buildChair(scene, x, z - 0.7, 0, chairColor, baseY);
      buildChair(scene, x, z + 0.7, Math.PI, chairColor, baseY);
      buildChair(scene, x - 0.7, z, Math.PI / 2, chairColor, baseY);
    }
  }

  buildUmbrella(scene, 14, southRowZ, 0xc03030, baseY);
  buildUmbrella(scene, 20, northRowZ, 0xc03030, baseY);
  buildUmbrella(scene, 27, southRowZ, 0xc03030, baseY);
  buildUmbrella(scene, 34, northRowZ, 0xc03030, baseY);
}

/**
 * A ring of trees around the facility using three instanced meshes (dark
 * conifers, rounded broadleaf, tall spruce) plus a handful of individual
 * trees placed close behind the south/west fence for a "forest right at
 * the courts" feel matching the reference photos. Ring trees are placed in
 * an annulus so the interior stays clear; every tree's foot sits at
 * `groundHeight(x, z)` so none float or sink (matters near the plateau
 * edge, cheap insurance everywhere else since the ground is flat there).
 */
export function buildForest(scene, count = 650, innerR = 75, outerR = 220) {
  // Conifer: trunk cone stack — we approximate with a single tall cone + trunk merged look.
  const coniferGeo = new THREE.ConeGeometry(2.4, 9, 7);
  coniferGeo.translate(0, 5.4, 0);
  const coniferMat = new THREE.MeshStandardMaterial({ color: 0x2b4d2a, roughness: 1, flatShading: true });

  const broadGeo = new THREE.IcosahedronGeometry(3.2, 0);
  broadGeo.translate(0, 6.5, 0);
  const broadMat = new THREE.MeshStandardMaterial({ color: 0x3f7532, roughness: 1, flatShading: true });

  // Tall spruce: a slender, much taller cone for height variety at the tree line.
  const spruceGeo = new THREE.ConeGeometry(1.6, 13, 7);
  spruceGeo.translate(0, 7.5, 0);
  const spruceMat = new THREE.MeshStandardMaterial({ color: 0x24402a, roughness: 1, flatShading: true });

  const trunkGeo = new THREE.CylinderGeometry(0.28, 0.36, 4, 6);
  trunkGeo.translate(0, 2, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5b4127, roughness: 1 });

  // 8-10 individual trees close behind the south/west fence (outside the
  // court enclosure and off the plateau), on top of the ring capacity.
  const extraTrees = [
    { x: -20, z: -62 }, { x: -8, z: -64 }, { x: 5, z: -63 }, { x: 18, z: -61 }, { x: -30, z: -63 },
    { x: -62, z: -20 }, { x: -64, z: -8 }, { x: -63, z: 5 }, { x: -61, z: 18 }, { x: -65, z: -30 },
  ];
  const capacity = count + extraTrees.length;

  // Allocate full capacity for all three canopy types; unused slots are
  // parked far below ground.
  const conifer = new THREE.InstancedMesh(coniferGeo, coniferMat, capacity);
  const broad = new THREE.InstancedMesh(broadGeo, broadMat, capacity);
  const spruce = new THREE.InstancedMesh(spruceGeo, spruceMat, capacity);
  const trunk = new THREE.InstancedMesh(trunkGeo, trunkMat, capacity);
  conifer.castShadow = broad.castShadow = spruce.castShadow = true;
  conifer.receiveShadow = broad.receiveShadow = spruce.receiveShadow = true;

  const dummy = new THREE.Object3D();
  // deterministic pseudo-random (no Math.random dependency issues), seeded by index
  const rand = (n) => {
    const s = Math.sin(n * 12.9898) * 43758.5453;
    return s - Math.floor(s);
  };

  const tmpColor = new THREE.Color();
  /** Sets `mesh`'s instance colour at `index` to `baseHex` scaled by a deterministic 0.85..1.15 factor. */
  const setVariedColor = (mesh, index, baseHex, seed) => {
    const factor = 0.85 + rand(seed) * 0.3;
    tmpColor.set(baseHex).multiplyScalar(factor);
    mesh.setColorAt(index, tmpColor);
  };

  let ci = 0, bi = 0, si = 0, ti = 0;
  const placeTree = (i, x, z) => {
    const s = 0.7 + rand(i + 3.1) * 0.9;
    const rot = rand(i + 5.5) * Math.PI * 2;

    dummy.position.set(x, groundHeight(x, z), z);
    dummy.rotation.set(0, rot, 0);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    trunk.setMatrixAt(ti++, dummy.matrix);

    const typeRoll = rand(i + 9.9);
    if (typeRoll < 0.4) {
      conifer.setMatrixAt(ci, dummy.matrix);
      setVariedColor(conifer, ci, 0x2b4d2a, i + 11.2);
      ci++;
    } else if (typeRoll < 0.72) {
      broad.setMatrixAt(bi, dummy.matrix);
      setVariedColor(broad, bi, 0x3f7532, i + 11.2);
      bi++;
    } else {
      spruce.setMatrixAt(si, dummy.matrix);
      setVariedColor(spruce, si, 0x24402a, i + 11.2);
      si++;
    }
  };

  for (let i = 0; i < count; i++) {
    const ang = rand(i + 1) * Math.PI * 2;
    const rad = innerR + rand(i + 7.3) * (outerR - innerR);
    placeTree(i, Math.cos(ang) * rad, Math.sin(ang) * rad);
  }
  extraTrees.forEach((t, k) => placeTree(count + k, t.x, t.z));

  // Park unused instance slots far below ground so they never render.
  const hide = new THREE.Object3D();
  hide.position.set(0, -1000, 0); hide.updateMatrix();
  for (; ci < capacity; ci++) conifer.setMatrixAt(ci, hide.matrix);
  for (; bi < capacity; bi++) broad.setMatrixAt(bi, hide.matrix);
  for (; si < capacity; si++) spruce.setMatrixAt(si, hide.matrix);

  conifer.instanceMatrix.needsUpdate = true;
  broad.instanceMatrix.needsUpdate = true;
  spruce.instanceMatrix.needsUpdate = true;
  trunk.instanceMatrix.needsUpdate = true;
  if (conifer.instanceColor) conifer.instanceColor.needsUpdate = true;
  if (broad.instanceColor) broad.instanceColor.needsUpdate = true;
  if (spruce.instanceColor) spruce.instanceColor.needsUpdate = true;
  scene.add(conifer, broad, spruce, trunk);
}
