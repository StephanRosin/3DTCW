import * as THREE from 'three';
import { addBox } from './collision.js';
import { pbr, loadTex } from './textures.js';

/**
 * The entrance portal, built directly at the terrace: a stone arch wall
 * (matching the TCW6 reference photo) that players walk through from the
 * forecourt onto the deep terrace, with a round TCW logo plaque and a big
 * Waidcup poster on the east (forecourt) face.
 *
 * Everything lives in a group offset to the plateau top (y = PLATEAU.h =
 * 1.5); local Y therefore reads as "height above the terrace/forecourt
 * ground" throughout this file.
 */
export function buildEntrance(scene) {
  const group = new THREE.Group();
  group.position.set(0, 1.5, 0);
  scene.add(group);

  const wallX = -12;          // wall centreline
  // Wall now runs all the way to the walkway edge (z=-21.3) so it joins the
  // terrace's south retaining wall/hedge with no gap at the x=-12 corner.
  const wallMinZ = -36, wallMaxZ = -21.3;   // 14.7 m span
  const wallCz = (wallMinZ + wallMaxZ) / 2;   // -28.65 (wall midpoint, NOT the arch — see below)
  const wallLen = wallMaxZ - wallMinZ;         // 14.7
  const wallH = 3.6;
  const wallThickness = 0.6;

  // Arch opening sits near the SOUTH end of the wall (forecourt/tribune
  // corner), leaving a long stone run to the north for the Waidcup poster.
  // NOTE on the local->world mapping: the wall mesh is rotated rotation.y =
  // +PI/2, so local shape-X maps to world Z as `wallCz - localX` (NOT
  // `wallCz + localX`) — verified against the actual rendered geometry.
  // archLocalX must therefore be `wallCz - archWorldZ`, the inverse of the
  // naive `archWorldZ - wallCz` (which mirrors the hole to the wrong end
  // of the wall).
  const archWorldZ = -24.0;
  const archLocalX = wallCz - archWorldZ;   // local shape-X offset of the hole (-4.65)

  // --- Stone arch wall --------------------------------------------------
  const shape = new THREE.Shape();
  const hw = wallLen / 2;
  shape.moveTo(-hw, 0); shape.lineTo(hw, 0); shape.lineTo(hw, wallH); shape.lineTo(-hw, wallH); shape.closePath();

  const jambHalfW = 1.3, jambH = 1.9;
  const hole = new THREE.Path();
  hole.moveTo(archLocalX - jambHalfW, 0);
  hole.lineTo(archLocalX - jambHalfW, jambH);
  hole.absarc(archLocalX, jambH, jambHalfW, Math.PI, 0, true);   // semicircle apex at jambH + jambHalfW = 3.2
  hole.lineTo(archLocalX + jambHalfW, 0);
  hole.closePath();
  // NOTE: the hole must stay flush with the outer shape's own Y=0 bottom
  // edge (NOT sunk below it) — a hole path that exits the outer contour
  // fails to triangulate correctly and ExtrudeGeometry silently renders the
  // wall solid, with no arch opening at all. Fixed below instead by
  // lifting the whole wall mesh a couple cm off the deck.
  shape.holes.push(hole);

  const wallGeo = new THREE.ExtrudeGeometry(shape, { depth: wallThickness, bevelEnabled: false });
  // Same wood-PBR recipe as the clubhouse/restaurant facade (Task 10's
  // facadeMat in props.js: color 0xb0925f, roughness 0.85), so the entrance
  // wall reads as part of the same building family. Repeat is scaled down
  // from the facade's [8, 1.5] over its 42 m length to this wall's 14.7 m
  // length, keeping the same texel density; the height repeat (1.5) is
  // unchanged since both walls share the same 3.6 m height.
  const wallMat = pbr({ dir: 'assets/textures/wood', color: 0xb0925f, repeat: [8 * (wallLen / 42), 1.5], roughness: 0.85 });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  // Shape-X (wall length) rotates onto world Z, shape-Z (thickness) onto world X.
  // Y is raised 2 cm off the deck: the arch hole's bottom edge sweeps into a
  // real horizontal "sill" quad (ExtrudeGeometry extrudes every contour
  // edge, hole included) that would otherwise sit exactly coplanar with the
  // terrace deck's paving top and z-fight with it in the open archway — the
  // only place it's ever exposed (elsewhere it's buried under solid wall).
  wall.position.set(wallX - wallThickness / 2, 0.02, wallCz);
  wall.rotation.y = Math.PI / 2;
  wall.castShadow = true; wall.receiveShadow = true;
  group.add(wall);

  // Colliders either side of the arch passage (world coords; the passage
  // itself is free between z -25.3..-22.7, matching the stone hole). The
  // south jamb collider ends exactly at the plateau's south edge (z=-21.3),
  // flush with the retaining-wall collider east of x=-12 (see
  // buildTerracePlateau) — no walkable gap at the corner.
  addBox(-12.35, -36, -11.65, -25.3);
  addBox(-12.35, -22.7, -11.65, -21.3);

  // --- Round TCW logo plaque, east (forecourt) face, on the SOUTH jamb ---
  // (the short 1.4 m wall stub z -22.7..-21.3), immediately left of the arch
  // as the player arrives (user-left = south in the plaza arrival view).
  const logoMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  logoMat.map = loadTex('assets/logos/tcw-logo.jpg', {
    srgb: true,
    onError: () => { logoMat.map = null; logoMat.color.set(0x26418f); logoMat.needsUpdate = true; },
  });
  const logo = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), logoMat);
  logo.position.set(-11.62, 1.9, -22.0);
  logo.rotation.y = Math.PI / 2;   // normal -> +X, faces the arriving player
  group.add(logo);

  // --- Big Waidcup poster, on the long north wall section (user-right on
  // arrival), kept well clear of the arch opening (opening starts at
  // z=-25.3; poster stays north of that with a >=1.2 m gap) so it never
  // crowds the entrance. Sized off the source PNG's aspect ratio so it
  // never looks stretched.
  const posterAspect = 797 / 866;   // assets/logos/waidcup.png (portrait poster)
  const posterH = 3.0, posterW = posterH * posterAspect;
  const posterMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  posterMat.map = loadTex('assets/logos/waidcup.png', {
    srgb: true,
    onError: () => { posterMat.map = null; posterMat.color.set(0x3d8f3d); posterMat.needsUpdate = true; },
  });
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(posterW, posterH), posterMat);
  poster.position.set(-11.62, 1.9, -30.0);
  poster.rotation.y = Math.PI / 2;   // faces the arriving player, same as the logo
  group.add(poster);

  // --- Plaza greenery, at the COURT side of the plaza (the natural
  // boundary between the Grotto walkway and the TCW terrace), NOT near the
  // buildings/entrance. Sits just north of (behind) the terrace's south
  // retaining-wall hedge line (z≈-21.2), on the plaza itself. -------------
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x2e5c28, roughness: 1, flatShading: true });
  function buildBush(x, z, r) {
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), bushMat);
    bush.position.set(x, r * 0.85, z);
    bush.castShadow = true; bush.receiveShadow = true;
    group.add(bush);
  }
  buildBush(-1, -21.7, 1.0);
  buildBush(3, -21.7, 1.2);
  buildBush(7, -21.7, 0.8);

  // Planter, same court-side boundary, east of the bushes.
  const planterMat = new THREE.MeshStandardMaterial({ color: 0x3d6b2e, roughness: 1 });
  const planter = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.8), planterMat);
  planter.position.set(11, 0.25, -21.7);
  planter.castShadow = true; planter.receiveShadow = true;
  group.add(planter);

  const startPos = new THREE.Vector3(4, 0, -24.0);
  const lookTarget = new THREE.Vector3(-20, 0, -24.0);
  return { startPos, lookTarget };
}
