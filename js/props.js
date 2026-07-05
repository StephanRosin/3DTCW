import * as THREE from 'three';
import { addBox, addWall, PLATEAU, RAMPS } from './collision.js';
import { pbr } from './textures.js';

export const wood = (c = 0x8a5a33) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0 });
export const metalDark = new THREE.MeshStandardMaterial({ color: 0x2b2f33, roughness: 0.5, metalness: 0.6 });

/** A simple café table (round top on a stem). Returns world position of the top. */
export function buildTable(scene, x, z, color = 0xf3f1ea) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const topMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 20), topMat);
  top.position.y = 0.72; top.castShadow = true; g.add(top);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.72, 10), metalDark);
  stem.position.y = 0.36; g.add(stem);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.04, 14), metalDark);
  foot.position.y = 0.02; g.add(foot);
  scene.add(g);
  addBox(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
  return new THREE.Vector3(x, 0.72, z);
}

/** A simple chair. */
export function buildChair(scene, x, z, rotY = 0, color = 0x3a4a5a) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
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
export function buildUmbrella(scene, x, z, color = 0x2f6fb0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
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

/** A trimmed hedge (box). */
export function buildHedge(scene, x, z, w, d, h = 0.8) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x3d6b2e, roughness: 1 });
  const hedge = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  hedge.position.set(x, h / 2, z);
  hedge.castShadow = true; hedge.receiveShadow = true;
  scene.add(hedge);
  addBox(x - w / 2, z - d / 2, x + w / 2, z + d / 2);
}

/**
 * The raised terrace plateau north of the courts (Task 6): a solid platform
 * (+1.5 m) that will carry the future clubhouse/terrace (Task 7) and the
 * entrance walkway (Task 8). Its south edge has a concrete retaining wall
 * with a low hedge on top, except in the two RAMPS X-ranges where sitting
 * steps (grandstand/staircase) lead down to ground level — those are the
 * walkable ramps aligned with the north-fence gates; `groundHeight()` in
 * collision.js provides the smooth Y ramp players actually walk on.
 */
export function buildTerracePlateau(scene) {
  const p = PLATEAU;
  const deckH = p.h;                 // 1.5
  const splitX = 8;                  // west = terrace paving, east = plain concrete deck (path in Task 8)
  const cz = (p.minZ + p.maxZ) / 2;
  const depth = p.maxZ - p.minZ;

  // --- Top deck: west (paving) + east (plain concrete-colour) -------------
  const pavingTop = pbr({ dir: 'assets/textures/paving', color: 0xb7b0a0, repeat: [15, 6], roughness: 0.95 });
  const concreteSide = pbr({ dir: 'assets/textures/concrete', color: 0x9a958c, repeat: [20, 1.5], roughness: 0.9 });
  const concreteTop = new THREE.MeshStandardMaterial({ color: 0x9a958c, roughness: 0.9 });

  function deckBox(minX, maxX, topMat) {
    const w = maxX - minX;
    const geo = new THREE.BoxGeometry(w, deckH, depth);
    // Face order: +x, -x, +y (top), -y (bottom), +z, -z
    const mesh = new THREE.Mesh(geo, [concreteSide, concreteSide, topMat, concreteSide, concreteSide, concreteSide]);
    mesh.position.set((minX + maxX) / 2, deckH / 2, cz);
    mesh.castShadow = true; mesh.receiveShadow = true;
    scene.add(mesh);
  }
  deckBox(p.minX, splitX, pavingTop);
  deckBox(splitX, p.maxX, concreteTop);

  // --- South retaining wall + hedge, skipping the two ramp X-ranges -------
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

    // Thin collider along the south edge/railing (blocks players from the north side too — intended).
    addBox(seg.minX, p.maxZ - 0.3, seg.maxX, p.maxZ + 0.1);
  }

  // West edge collider (north fence/forest side stays open).
  addWall(p.minX, p.minZ, p.minX, p.maxZ, 0.3);

  // --- Sitting steps (tribune west / staircase east) in both RAMPS zones --
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
 * The clubhouse building with a slatted wooden pergola over the terrace.
 * `southZ` is the front (terrace) edge line. Building sits behind it.
 * Returns the terrace centre so the caller can furnish it.
 */
export function buildClubhouse(scene, centerX, southZ) {
  const bw = 16, bd = 8, bh = 3.4;
  const bz = southZ + bd / 2 + 0.2;   // building further from courts (+Z)

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.9 });
  const building = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), wallMat);
  building.position.set(centerX, bh / 2, bz);
  building.castShadow = true; building.receiveShadow = true;
  scene.add(building);
  addBox(centerX - bw / 2, bz - bd / 2, centerX + bw / 2, bz + bd / 2);

  // Flat-ish roof slab
  const roof = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.6, 0.3, bd + 0.6),
    new THREE.MeshStandardMaterial({ color: 0x5a4636, roughness: 0.8 }));
  roof.position.set(centerX, bh + 0.15, bz);
  roof.castShadow = true; scene.add(roof);

  // Windows / door strip facing the terrace (-Z face)
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x6fa0c8, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.65 });
  for (let i = -1; i <= 1; i++) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 0.1), glassMat);
    win.position.set(centerX + i * 4.4, 1.7, bz - bd / 2 - 0.02);
    scene.add(win);
  }

  // Pergola over the terrace (between building and courts).
  const perW = 15, perD = 6;
  const perZ = southZ - perD / 2 - 0.3;   // toward courts (-Z from front line)
  buildPergola(scene, centerX, perZ, perW, perD);

  return new THREE.Vector3(centerX, 0, perZ);
}

function buildPergola(scene, cx, cz, w, d) {
  const postMat = wood(0x8a5a33);
  const beamMat = wood(0x9a6a40);
  const hw = w / 2, hd = d / 2, top = 2.6;

  // Corner + mid posts
  const postXs = [-hw, -hw / 2, 0, hw / 2, hw];
  for (const px of [postXs[0], postXs[2], postXs[4]]) {
    for (const pz of [-hd, hd]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, top, 10), postMat);
      post.position.set(cx + px, top / 2, cz + pz);
      post.castShadow = true; scene.add(post);
      addBox(cx + px - 0.15, cz + pz - 0.15, cx + px + 0.15, cz + pz + 0.15);
    }
  }
  // Perimeter beams (long axis)
  for (const pz of [-hd, hd]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, 0.14), beamMat);
    beam.position.set(cx, top, cz + pz); beam.castShadow = true; scene.add(beam);
  }
  // Cross slats
  const n = Math.floor(w / 0.5);
  for (let i = 0; i <= n; i++) {
    const x = -hw + (i / n) * w;
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, d + 0.2), beamMat);
    slat.position.set(cx + x, top + 0.08, cz); scene.add(slat);
  }
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
