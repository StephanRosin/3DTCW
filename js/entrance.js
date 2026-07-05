import * as THREE from 'three';
import { addBox } from './collision.js';
import { pbr, loadTex } from './textures.js';

/**
 * The entrance portal, built directly at the terrace: a stone arch wall
 * (matching the TCW6 reference photo) that players walk through from the
 * forecourt onto the deep terrace, with a round TCW logo plaque beside the
 * arch and a Waidcup flag on a pole.
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
  const wallMinZ = -36, wallMaxZ = -22;   // 14 m span
  const wallCz = (wallMinZ + wallMaxZ) / 2;   // -29 (also the arch centre)
  const wallLen = wallMaxZ - wallMinZ;         // 14
  const wallH = 3.6;
  const wallThickness = 0.6;

  // --- Stone arch wall --------------------------------------------------
  const shape = new THREE.Shape();
  const hw = wallLen / 2;
  shape.moveTo(-hw, 0); shape.lineTo(hw, 0); shape.lineTo(hw, wallH); shape.lineTo(-hw, wallH); shape.closePath();

  const jambHalfW = 1.3, jambH = 1.9;
  const hole = new THREE.Path();
  hole.moveTo(-jambHalfW, 0);
  hole.lineTo(-jambHalfW, jambH);
  hole.absarc(0, jambH, jambHalfW, Math.PI, 0, true);   // semicircle apex at jambH + jambHalfW = 3.2
  hole.lineTo(jambHalfW, 0);
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

  // Colliders either side of the arch passage (world coords; arch itself is
  // free between z -30.3..-27.7 — a bit more generous than the stone hole
  // once the player radius is accounted for).
  addBox(-12.35, -36, -11.65, -30.3);
  addBox(-12.35, -27.7, -11.65, -22);

  // --- Round TCW logo plaque, east (forecourt) face, beside the arch -----
  const logoMat = new THREE.MeshStandardMaterial({ color: 0x26418f, roughness: 0.4 });
  logoMat.map = loadTex('assets/logos/tcw-logo.jpg', {
    srgb: true,
    onError: () => { logoMat.map = null; logoMat.needsUpdate = true; },
  });
  const logo = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), logoMat);
  logo.position.set(-11.62, 1.9, -26.6);
  logo.rotation.y = Math.PI / 2;   // normal -> +X, faces the arriving player
  group.add(logo);

  // --- Flagpole + Waidcup flag -------------------------------------------
  const poleH = 6, poleR = 0.05;
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x777b80, roughness: 0.4, metalness: 0.7 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(poleR, poleR, poleH, 10), poleMat);
  pole.position.set(-11.4, poleH / 2, -33);
  pole.castShadow = true; group.add(pole);

  const flagMat = new THREE.MeshStandardMaterial({ color: 0x3d8f3d, roughness: 0.8, side: THREE.DoubleSide });
  flagMat.map = loadTex('assets/logos/waidcup.png', {
    srgb: true,
    onError: () => { flagMat.map = null; flagMat.needsUpdate = true; },
  });
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.8), flagMat);
  flag.position.set(-11.1, 4.4, -33);
  flag.rotation.y = Math.PI / 2;   // face the flag toward the player's approach (along X), not edge-on
  flag.castShadow = true; group.add(flag);

  addBox(-11.6, -33.2, -11.2, -32.8);

  // --- Forecourt plaza greenery (between the arch and the two terraces) --
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x2e5c28, roughness: 1, flatShading: true });
  function buildBush(x, z, r) {
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), bushMat);
    bush.position.set(x, r * 0.85, z);
    bush.castShadow = true; bush.receiveShadow = true;
    group.add(bush);
  }
  buildBush(-2, -22.5, 1.0);
  buildBush(3, -22.2, 1.2);
  buildBush(-5.5, -23, 0.8);

  const planterMat = new THREE.MeshStandardMaterial({ color: 0x3d6b2e, roughness: 1 });
  const planter = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.8), planterMat);
  planter.position.set(-1, 0.25, -21.6);
  planter.castShadow = true; planter.receiveShadow = true;
  group.add(planter);

  const startPos = new THREE.Vector3(4, 0, -29);
  const lookTarget = new THREE.Vector3(-20, 0, -29);
  return { startPos, lookTarget };
}
