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
  shape.holes.push(hole);

  const wallGeo = new THREE.ExtrudeGeometry(shape, { depth: wallThickness, bevelEnabled: false });
  const stoneMat = pbr({ dir: 'assets/textures/stone', color: 0x9a938a, repeat: [4, 1.2] });
  const wall = new THREE.Mesh(wallGeo, stoneMat);
  // Shape-X (wall length) rotates onto world Z, shape-Z (thickness) onto world X.
  wall.position.set(wallX - wallThickness / 2, 0, wallCz);
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

  // --- Forecourt plaza greenery, kept clear of the arch approach lane -----
  // (the z≈-24.0 walkway from startPos through the arch stays open); bushes
  // sit north toward the clubhouse-corner of the plaza, well clear of it.
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x2e5c28, roughness: 1, flatShading: true });
  function buildBush(x, z, r) {
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), bushMat);
    bush.position.set(x, r * 0.85, z);
    bush.castShadow = true; bush.receiveShadow = true;
    group.add(bush);
  }
  buildBush(6, -34, 1.0);
  buildBush(2, -33.5, 1.2);
  buildBush(-8, -35, 0.8);

  // Planter relocated off the ramp lane, onto the restaurant side.
  const planterMat = new THREE.MeshStandardMaterial({ color: 0x3d6b2e, roughness: 1 });
  const planter = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.8), planterMat);
  planter.position.set(14, 0.25, -22.3);
  planter.castShadow = true; planter.receiveShadow = true;
  group.add(planter);

  const startPos = new THREE.Vector3(4, 0, -24.0);
  const lookTarget = new THREE.Vector3(-20, 0, -24.0);
  return { startPos, lookTarget };
}
