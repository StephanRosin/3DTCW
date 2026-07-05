// Simple axis-aligned collision. All colliders are boxes in the XZ plane.
// The player is treated as a circle of a given radius and pushed out of any box it overlaps.

export const colliders = [];

// --- Ground height model (Task 6) ---------------------------------------
// North of the courts, a raised terrace plateau carries the future clubhouse
// (Task 7) and entrance walkway (Task 8). Two ramp zones (aligned with the
// north-fence gates) let players walk up/down between plateau and ground.
export const PLATEAU = { minX: -38, maxX: 75, minZ: -40, maxZ: -21, h: 1.5, stepDepth: 2.4 };
export const RAMPS = [ { minX: -38, maxX: 8 }, { minX: 37, maxX: 43 } ];

export function groundHeight(x, z) {
  const p = PLATEAU;
  if (x < p.minX || x > p.maxX) return 0;
  if (z >= p.minZ && z <= p.maxZ) return p.h;
  if (z > p.maxZ && z <= p.maxZ + p.stepDepth
      && RAMPS.some((r) => x >= r.minX && x <= r.maxX)) {
    return p.h * (1 - (z - p.maxZ) / p.stepDepth);
  }
  return 0;
}

/** Register an axis-aligned box collider (world coordinates). */
export function addBox(minX, minZ, maxX, maxZ) {
  colliders.push({ minX, minZ, maxX, maxZ });
}

/** Add a thin wall between two points (only horizontal/vertical walls). */
export function addWall(x1, z1, x2, z2, thickness = 0.15) {
  const t = thickness / 2;
  addBox(
    Math.min(x1, x2) - t, Math.min(z1, z2) - t,
    Math.max(x1, x2) + t, Math.max(z1, z2) + t
  );
}

/**
 * Resolve the player position against all colliders.
 * Mutates `pos` (a THREE.Vector3) in place, only touching x and z.
 */
export function resolveCollisions(pos, radius) {
  for (const b of colliders) {
    // Closest point on the box to the circle centre.
    const cx = Math.max(b.minX, Math.min(pos.x, b.maxX));
    const cz = Math.max(b.minZ, Math.min(pos.z, b.maxZ));
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const distSq = dx * dx + dz * dz;

    if (distSq > radius * radius) continue;

    if (distSq > 1e-8) {
      // Outside the box but within radius: push straight out.
      const dist = Math.sqrt(distSq);
      const push = radius - dist;
      pos.x += (dx / dist) * push;
      pos.z += (dz / dist) * push;
    } else {
      // Centre is inside the box: push out along the axis of least penetration.
      const penLeft = pos.x - b.minX;
      const penRight = b.maxX - pos.x;
      const penFront = pos.z - b.minZ;
      const penBack = b.maxZ - pos.z;
      const minPen = Math.min(penLeft, penRight, penFront, penBack);
      if (minPen === penLeft) pos.x = b.minX - radius;
      else if (minPen === penRight) pos.x = b.maxX + radius;
      else if (minPen === penFront) pos.z = b.minZ - radius;
      else pos.z = b.maxZ + radius;
    }
  }
}
