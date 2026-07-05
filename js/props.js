import * as THREE from 'three';
import { addBox, PLATEAU, RAMPS } from './collision.js';
import { pbr, loadTex } from './textures.js';

export const wood = (c = 0x8a5a33) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0 });
export const metalDark = new THREE.MeshStandardMaterial({ color: 0x2b2f33, roughness: 0.5, metalness: 0.6 });

/** A simple café table (round top on a stem). Returns world position of the top. */
export function buildTable(scene, x, z, color = 0xf3f1ea, y = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const topMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 20), topMat);
  top.position.y = 0.72; top.castShadow = true; g.add(top);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.72, 10), metalDark);
  stem.position.y = 0.36; g.add(stem);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.04, 14), metalDark);
  foot.position.y = 0.02; g.add(foot);
  scene.add(g);
  addBox(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
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

  const facadeMat = pbr({ dir: 'assets/textures/wood', color: 0x4a3826, repeat: [8, 1.5], roughness: 0.85 });
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
function signTexture(text, { bg = '#26313a', fg = '#ffffff' } = {}) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 1024, 256);
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 6; g.strokeRect(8, 8, 1008, 240);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'bold 110px Arial'; g.fillText(text, 512, 128);
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

  const { baseY, southZ } = buildLongBuilding(scene, bx, bz, {
    signage: (scene, cx, baseY, southZ) => {
      // TCW logo rondell on the south facade (faces +Z toward the courts, no rotation needed)
      const logoMat = new THREE.MeshStandardMaterial({ color: 0x26418f, roughness: 0.4 });
      logoMat.map = loadTex('assets/logos/tcw-logo.jpg', {
        srgb: true,
        onError: () => { logoMat.map = null; logoMat.needsUpdate = true; },
      });
      const logo = new THREE.Mesh(new THREE.CircleGeometry(0.7, 32), logoMat);
      logo.position.set(cx, baseY + 1.9, southZ + 0.06);
      scene.add(logo);
    },
  });

  // --- Pergola over the deep terrace ------------------------------------
  buildPergola(scene, -31.2, -31, 14, 5, baseY);

  // Café tables + chairs spread across the deep terrace (z -34..-24,
  // x -44..-16): some under the pergola, some in the open. Kept out of
  // x -33..-29.5/z>-23 so the stair-mouth corridor at x=-31.2 stays clear,
  // and out of the z≈-29 east-west line so the arch walkway (coming from
  // the entrance at x=-12) keeps a clear meander toward the stairs.
  const chairColor = 0x3a4a5a;

  // Group 1 — open, west side, near the south (stair) edge.
  buildTable(scene, -40, -26, 0xf3f1ea, baseY);
  buildChair(scene, -40, -26.7, 0, chairColor, baseY);
  buildChair(scene, -40, -25.3, Math.PI, chairColor, baseY);
  buildChair(scene, -40.7, -26, Math.PI / 2, chairColor, baseY);

  // Group 2 — under the pergola, west side, deeper into the terrace.
  buildTable(scene, -35, -32.5, 0xf3f1ea, baseY);
  buildChair(scene, -35, -33.2, 0, chairColor, baseY);
  buildChair(scene, -35, -31.8, Math.PI, chairColor, baseY);

  // Group 3 — under the pergola, east side.
  buildTable(scene, -25.5, -32, 0xf3f1ea, baseY);
  buildChair(scene, -25.5, -32.7, 0, chairColor, baseY);
  buildChair(scene, -25.5, -31.3, Math.PI, chairColor, baseY);
  buildChair(scene, -24.8, -32, -Math.PI / 2, chairColor, baseY);

  // Group 4 — open, east side toward the entrance forecourt, near the
  // south edge (keeps the z≈-29 arch-walkway line clear).
  buildTable(scene, -19, -25.5, 0xf3f1ea, baseY);
  buildChair(scene, -19, -26.2, 0, chairColor, baseY);
  buildChair(scene, -19, -24.8, Math.PI, chairColor, baseY);

  // Red umbrellas (3)
  buildUmbrella(scene, -40, -26, 0xc03030, baseY);
  buildUmbrella(scene, -35, -32.5, 0xc03030, baseY);
  buildUmbrella(scene, -19, -25.5, 0xc03030, baseY);

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
 * "RESTAURANT" sign board instead of the TCW rondell, and a restaurant
 * terrace of tables/chairs/umbrellas in front of it. A walking lane along
 * z≈-29 is kept clear so the forecourt plaza connects through to the
 * clubhouse terrace.
 */
export function buildRestaurant(scene) {
  const bx = 23.4, bz = -39.5;

  const { baseY, southZ } = buildLongBuilding(scene, bx, bz, {
    signage: (scene, cx, baseY, southZ) => {
      const signMat = new THREE.MeshBasicMaterial({ map: signTexture('RESTAURANT'), side: THREE.FrontSide });
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.7), signMat);
      sign.position.set(cx, baseY + 2.8, southZ + 0.06);
      scene.add(sign);
    },
  });

  // Restaurant terrace (x 10..40, z -35..-24): 8 table groups + 4 red
  // umbrellas, kept off the z≈-29 walking lane that connects the forecourt
  // plaza through to the clubhouse terrace.
  const chairColor = 0x3a4a5a;
  const northRowZ = -33, southRowZ = -26;
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
 * A ring of trees around the facility using two instanced meshes
 * (dark conifers + rounded broadleaf). Trees are placed in an annulus
 * so the interior stays clear.
 */
export function buildForest(scene, count = 420, innerR = 78, outerR = 230) {
  // Conifer: trunk cone stack — we approximate with a single tall cone + trunk merged look.
  const coniferGeo = new THREE.ConeGeometry(2.4, 9, 7);
  coniferGeo.translate(0, 5.4, 0);
  const coniferMat = new THREE.MeshStandardMaterial({ color: 0x2b4d2a, roughness: 1, flatShading: true });

  const broadGeo = new THREE.IcosahedronGeometry(3.2, 0);
  broadGeo.translate(0, 6.5, 0);
  const broadMat = new THREE.MeshStandardMaterial({ color: 0x3f7532, roughness: 1, flatShading: true });

  const trunkGeo = new THREE.CylinderGeometry(0.28, 0.36, 4, 6);
  trunkGeo.translate(0, 2, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5b4127, roughness: 1 });

  // Allocate full capacity for both; unused slots are parked far below ground.
  const conifer = new THREE.InstancedMesh(coniferGeo, coniferMat, count);
  const broad = new THREE.InstancedMesh(broadGeo, broadMat, count);
  const trunk = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
  conifer.castShadow = broad.castShadow = true;
  conifer.receiveShadow = broad.receiveShadow = true;

  const dummy = new THREE.Object3D();
  // deterministic pseudo-random (no Math.random dependency issues), seeded by index
  const rand = (n) => {
    const s = Math.sin(n * 12.9898) * 43758.5453;
    return s - Math.floor(s);
  };

  let ci = 0, bi = 0, ti = 0;
  for (let i = 0; i < count; i++) {
    const ang = rand(i + 1) * Math.PI * 2;
    const rad = innerR + rand(i + 7.3) * (outerR - innerR);
    const x = Math.cos(ang) * rad;
    const z = Math.sin(ang) * rad;
    const s = 0.7 + rand(i + 3.1) * 0.9;
    const rot = rand(i + 5.5) * Math.PI * 2;

    dummy.position.set(x, 0, z);
    dummy.rotation.set(0, rot, 0);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    trunk.setMatrixAt(ti++, dummy.matrix);

    if (rand(i + 9.9) < 0.62) {
      conifer.setMatrixAt(ci++, dummy.matrix);
    } else {
      broad.setMatrixAt(bi++, dummy.matrix);
    }
  }
  // Park unused instance slots far below ground so they never render.
  const hide = new THREE.Object3D();
  hide.position.set(0, -1000, 0); hide.updateMatrix();
  for (; ci < count; ci++) conifer.setMatrixAt(ci, hide.matrix);
  for (; bi < count; bi++) broad.setMatrixAt(bi, hide.matrix);

  conifer.instanceMatrix.needsUpdate = true;
  broad.instanceMatrix.needsUpdate = true;
  trunk.instanceMatrix.needsUpdate = true;
  scene.add(conifer, broad, trunk);
}
