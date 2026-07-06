# Tennisball werfen – Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Im 3D-Rundgang mit gehaltener linker Maustaste einen Tennisball in Blickrichtung werfen (länger = weiter), mit realistischer Aufprallphysik (Boden + Hindernisse) und einer Ladeanzeige als Ring ums Crosshair.

**Architecture:** Reine, unit-getestete Physik in `js/ball-physics.js` (kein Three.js/DOM). Ein Browser-Modul `js/balls.js` besitzt Mesh-Pool, Laden/Werfen, Ring-HUD und substept die Physik. `collision.js` bekommt optionale Collider-Höhen (`top`), damit der Ball niedrige Netze/Bänke überfliegt bzw. seitlich abprallt. Eingebunden über `main.js` (Loop + Maus-Events, geguardet auf Pointer-Lock).

**Tech Stack:** Vanilla Three.js r160 (Importmap, kein Build), ES-Module, Node built-in Test-Runner (`node --test`).

## Global Constraints

- Kein Build-Schritt, kein npm-Dependency: nur ES-Module + vorhandene Importmap (`three`).
- Der `<script type="importmap">`-Block in `index.html` bleibt **unverändert** (der Monorepo-CSP-Guard hasht ihn).
- Desktop-only (die Tour zeigt auf Mobile ohnehin einen Hinweis); kein Touch-Wurf.
- Spieler-Kollision (`resolveCollisions`) muss **unverändert** bleiben.
- Max 1 Ball/Sekunde: Cooldown 1,0 s (`THROW_COOLDOWN`). Ladezeit bis Max 1,2 s (`CHARGE_TIME`).
- Nach der Implementierung: `npm run sync:tcw3d` im Monorepo (Snapshot), dann Deploy wie üblich.

## File Structure

- **Create** `package.json` — `{"type":"module"}`, damit `node --test` `.js` als ESM lädt (Browser ignoriert es).
- **Create** `js/ball-physics.js` — Konstanten + `stepBall(state, dt, groundFn, colliders)`, `resolveBox`. Keine Imports.
- **Create** `js/ball-physics.test.js` — Node-Tests für Fall/Bounce/Ruhe/Überfliegen/Seitenabprall.
- **Create** `js/balls.js` — `createBalls(scene, camera, ringEl)` → `{ update, startCharge, release, cancel }`.
- **Modify** `js/collision.js` — `addBox(minX,minZ,maxX,maxZ, top=Infinity)`.
- **Modify** `js/tennis.js` — Netz- und Divider-Collider mit Höhe.
- **Modify** `js/props.js` — Bank-Collider mit Sitzhöhe.
- **Modify** `index.html` — `#power-ring`-Div + CSS.
- **Modify** `js/main.js` — Ball-System instanziieren, Loop + Maus-Events verdrahten.

---

### Task 1: Reine Ballphysik + Tests

**Files:**
- Create: `package.json`
- Create: `js/ball-physics.js`
- Test: `js/ball-physics.test.js`

**Interfaces:**
- Produces: Konstanten `GRAVITY, BALL_R, RESTITUTION, BOUNCE_TANGENT, ROLL_FRICTION, AIR_DRAG, REST_SPEED`; `stepBall(state, dt, groundFn, colliders)` wobei `state = { pos:{x,y,z}, vel:{x,y,z}, resting:boolean }`, `groundFn(x,z)→number`, `colliders` = Array `{minX,minZ,maxX,maxZ, top?}`. Mutiert und gibt `state` zurück.

- [ ] **Step 1: Test-Datei schreiben**

Create `js/ball-physics.test.js`:

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { stepBall, BALL_R, REST_SPEED } from './ball-physics.js';

const flat = () => 0;                     // ebener Boden auf y=0
const ball = (pos, vel) => ({ pos: { ...pos }, vel: { ...vel }, resting: false });

test('Schwerkraft: Ball fällt', () => {
  const s = ball({ x: 0, y: 5, z: 0 }, { x: 0, y: 0, z: 0 });
  stepBall(s, 0.1, flat, []);
  assert.ok(s.vel.y < 0, 'vy negativ');
  assert.ok(s.pos.y < 5, 'y sinkt');
});

test('Boden-Bounce: vertikal reflektiert mit Energieverlust', () => {
  const s = ball({ x: 0, y: 0.05, z: 0 }, { x: 0, y: -5, z: 0 });
  stepBall(s, 0.02, flat, []);
  assert.ok(s.vel.y > 0, 'prallt nach oben');
  assert.ok(s.vel.y < 5, 'verliert Energie');
  assert.ok(s.pos.y >= BALL_R - 1e-9, 'über dem Boden');
});

test('Ruhe: langsamer Ball am Boden kommt zum Stillstand', () => {
  const s = ball({ x: 0, y: 0.05, z: 0 }, { x: 0, y: -0.1, z: 0 });
  stepBall(s, 0.02, flat, []);
  assert.equal(s.resting, true);
  assert.deepEqual(s.vel, { x: 0, y: 0, z: 0 });
});

test('Überfliegen: hoher Ball ignoriert niedrige Box (top)', () => {
  const box = { minX: -1, maxX: 1, minZ: -1, maxZ: 1, top: 1 };
  const s = ball({ x: -2, y: 3, z: 0 }, { x: 8, y: 0, z: 0 });
  for (let i = 0; i < 15; i++) stepBall(s, 0.02, flat, [box]);
  assert.ok(s.vel.x > 0, 'kein seitlicher Abprall über der Box');
  assert.ok(s.pos.x > 0, 'hat die Box überflogen');
});

test('Seitenabprall: niedriger Ball prallt an der Box-Wand ab', () => {
  const box = { minX: 0, maxX: 1, minZ: -1, maxZ: 1, top: 1 };
  const s = ball({ x: -0.03, y: 0.5, z: 0 }, { x: 10, y: 0, z: 0 });
  stepBall(s, 0.01, flat, [box]);
  assert.ok(s.vel.x < 0, 'X-Geschwindigkeit umgekehrt');
});
```

- [ ] **Step 2: Test laufen lassen – muss scheitern**

Run: `cd /home/stephan/Dokumente/TCW3D/3DTCW && node --test js/ball-physics.test.js`
Expected: Fehler „Cannot find module './ball-physics.js'" (Modul existiert noch nicht). Falls `node` `.js` als CommonJS meldet („require is not defined"/„Unexpected token export"), zuerst Step 3 (package.json).

- [ ] **Step 3: `package.json` anlegen (ESM für node --test)**

Create `package.json`:

```json
{
  "name": "tcw3d",
  "private": true,
  "type": "module"
}
```

- [ ] **Step 4: Physik implementieren**

Create `js/ball-physics.js`:

```js
// Reine Ballphysik (kein Three.js/DOM) – unit-testbar mit `node --test`.
// Ein Ballzustand: { pos:{x,y,z}, vel:{x,y,z}, resting:boolean }.

export const GRAVITY = 9.81;          // m/s^2
export const BALL_R = 0.045;          // m (Tennisball leicht vergrößert für Sichtbarkeit)
export const RESTITUTION = 0.75;      // vertikaler Bounce (Tennisball auf Hartplatz ~0.73)
export const BOUNCE_TANGENT = 0.9;    // Horizontalverlust je Bodenaufprall
export const ROLL_FRICTION = 2.5;     // Rollreibung pro Sekunde am Boden
export const AIR_DRAG = 0.1;          // Luftwiderstand pro Sekunde
export const REST_SPEED = 0.35;       // m/s: darunter am Boden -> Ruhe

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/** Kugel gegen AABB-Box (Boden 0 bis b.top). Reflektiert vel an der Kontaktnormale. */
function resolveBox(pos, vel, b) {
  const top = b.top ?? Infinity;
  const cx = clamp(pos.x, b.minX, b.maxX);
  const cy = clamp(pos.y, 0, top);
  const cz = clamp(pos.z, b.minZ, b.maxZ);
  let nx = pos.x - cx, ny = pos.y - cy, nz = pos.z - cz;
  const d2 = nx * nx + ny * ny + nz * nz;
  if (d2 >= BALL_R * BALL_R) return;              // keine Berührung

  if (d2 > 1e-10) {
    const d = Math.sqrt(d2);
    nx /= d; ny /= d; nz /= d;
    const push = BALL_R - d;
    pos.x += nx * push; pos.y += ny * push; pos.z += nz * push;
  } else {
    // Zentrum in der Box: entlang der kleinsten Penetration herausdrücken (ohne Unterseite).
    const pl = pos.x - b.minX, pr = b.maxX - pos.x;
    const pf = pos.z - b.minZ, pk = b.maxZ - pos.z;
    const pu = top - pos.y;
    const m = Math.min(pl, pr, pf, pk, pu);
    nx = ny = nz = 0;
    if (m === pl) { nx = -1; pos.x = b.minX - BALL_R; }
    else if (m === pr) { nx = 1; pos.x = b.maxX + BALL_R; }
    else if (m === pf) { nz = -1; pos.z = b.minZ - BALL_R; }
    else if (m === pk) { nz = 1; pos.z = b.maxZ + BALL_R; }
    else { ny = 1; pos.y = top + BALL_R; }
  }
  const vn = vel.x * nx + vel.y * ny + vel.z * nz;
  if (vn < 0) {
    const j = (1 + RESTITUTION) * vn;
    vel.x -= j * nx; vel.y -= j * ny; vel.z -= j * nz;
  }
}

/**
 * Integriert einen Ball um EINEN Schritt dt (Sekunden). Mutiert `state` und gibt
 * es zurück. `groundFn(x,z)` liefert die Bodenhöhe, `colliders` die AABB-Boxen
 * (mit optionalem `top`). Für dünne Wände in kleinen Schritten aufrufen (der
 * Renderer substept, siehe balls.js), damit nichts durchtunnelt.
 */
export function stepBall(state, dt, groundFn, colliders) {
  if (state.resting) return state;
  const p = state.pos, v = state.vel;

  v.y -= GRAVITY * dt;
  const drag = Math.max(0, 1 - AIR_DRAG * dt);
  v.x *= drag; v.y *= drag; v.z *= drag;

  p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;

  const h = groundFn(p.x, p.z);
  if (p.y - BALL_R <= h) {
    p.y = h + BALL_R;
    if (v.y < 0) { v.y = -v.y * RESTITUTION; v.x *= BOUNCE_TANGENT; v.z *= BOUNCE_TANGENT; }
    const rf = Math.max(0, 1 - ROLL_FRICTION * dt);
    v.x *= rf; v.z *= rf;
    if (Math.hypot(v.x, v.y, v.z) < REST_SPEED) { v.x = v.y = v.z = 0; state.resting = true; }
  }

  for (const b of colliders) resolveBox(p, v, b);
  return state;
}
```

- [ ] **Step 5: Tests laufen lassen – müssen bestehen**

Run: `node --test js/ball-physics.test.js`
Expected: `# pass 5`, `# fail 0`.

- [ ] **Step 6: Commit**

```bash
git add package.json js/ball-physics.js js/ball-physics.test.js
git commit -m "feat(ball): reine Tennisball-Physik (stepBall) + Tests"
```

---

### Task 2: Collider-Höhen (Ball überfliegt niedrige Objekte)

**Files:**
- Modify: `js/collision.js:74-76` (`addBox`)
- Modify: `js/tennis.js:129` (Netz), `js/tennis.js:461` (Divider)
- Modify: `js/props.js:128` (Bank)
- Test: `js/collision.test.js` (neu)

**Interfaces:**
- Consumes: nichts.
- Produces: `addBox(minX, minZ, maxX, maxZ, top = Infinity)`; Collider-Objekte tragen jetzt `top`. `resolveCollisions` (Spieler) bleibt unverändert (ignoriert `top`).

- [ ] **Step 1: Test schreiben**

Create `js/collision.test.js`:

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addBox, colliders } from './collision.js';

test('addBox: top ist standardmäßig Infinity', () => {
  colliders.length = 0;
  addBox(0, 0, 1, 1);
  assert.equal(colliders[0].top, Infinity);
});

test('addBox: top wird übernommen', () => {
  colliders.length = 0;
  addBox(0, 0, 1, 1, 1.07);
  assert.equal(colliders[0].top, 1.07);
});
```

- [ ] **Step 2: Test laufen lassen – muss scheitern**

Run: `node --test js/collision.test.js`
Expected: FAIL („expected Infinity" – `top` ist noch `undefined`).

- [ ] **Step 3: `addBox` um `top` erweitern**

Modify `js/collision.js`, ersetze:

```js
export function addBox(minX, minZ, maxX, maxZ) {
  colliders.push({ minX, minZ, maxX, maxZ });
}
```

durch:

```js
// `top` = Oberkante der Box (Default Infinity = volle Wand). Der Spieler
// (resolveCollisions) ignoriert `top`; nur die Ballphysik nutzt sie, damit
// niedrige Objekte (Netze, Bänke) überflogen werden können.
export function addBox(minX, minZ, maxX, maxZ, top = Infinity) {
  colliders.push({ minX, minZ, maxX, maxZ, top });
}
```

- [ ] **Step 4: Test laufen lassen – muss bestehen**

Run: `node --test js/collision.test.js`
Expected: `# pass 2`.

- [ ] **Step 5: Netz-Höhe setzen**

Modify `js/tennis.js:129`, ersetze:

```js
  addBox(cx - halfLen, -0.06, cx + halfLen, 0.06);
```

durch:

```js
  addBox(cx - halfLen, -0.06, cx + halfLen, 0.06, netH);   // netH ≈ 1.07: Ball fliegt drüber
```

- [ ] **Step 6: Divider-Höhe setzen**

Modify `js/tennis.js:461` (in `buildCourtDivider`), ersetze:

```js
    addBox(x - 0.08, z0, x + 0.08, z1);
```

durch:

```js
    addBox(x - 0.08, z0, x + 0.08, z1, height);   // Trennnetz-Höhe (Default 2 m)
```

- [ ] **Step 7: Bank-Höhe setzen**

Modify `js/props.js:128` (in `buildBenchBackless`), ersetze:

```js
  addBox(x - halfX, z - halfZ, x + halfX, z + halfZ);
```

durch:

```js
  addBox(x - halfX, z - halfZ, x + halfX, z + halfZ, y + 0.48);   // Sitzhöhe: Ball kann auf der Bank landen
```

- [ ] **Step 8: Regressions-Check (Syntax) + Commit**

Run: `node --check js/tennis.js && node --check js/props.js && node --check js/collision.js && echo OK`
Expected: `OK`

```bash
git add js/collision.js js/collision.test.js js/tennis.js js/props.js
git commit -m "feat(ball): Collider-Höhen (top) für Netze/Divider/Bänke"
```

---

### Task 3: Ball-System (Werfen, Laden, Rendern, Lebensdauer)

**Files:**
- Create: `js/balls.js`

**Interfaces:**
- Consumes: `stepBall, BALL_R` aus `./ball-physics.js`; `groundHeight, colliders` aus `./collision.js`; `THREE`.
- Produces: `createBalls(scene, camera, ringEl) → { update(dt), startCharge(), release(), cancel() }`. `update(dt)` integriert Physik + Lebensdauer und aktualisiert den Ring; `startCharge()/release()/cancel()` steuern das Aufladen; `ringEl` ist das `#power-ring`-DOM-Element.

- [ ] **Step 1: Modul implementieren**

Create `js/balls.js`:

```js
import * as THREE from 'three';
import { stepBall, BALL_R } from './ball-physics.js';
import { groundHeight, colliders } from './collision.js';

const CHARGE_TIME = 1.2;        // s bis Maximalladung
const THROW_COOLDOWN = 1.0;     // s zwischen Würfen (max 1 Ball/s)
const SPEED_MIN = 6;            // m/s bei 0 % Ladung
const SPEED_MAX = 20;           // m/s bei 100 % Ladung
const LIFETIME = 8;             // s bis der Ball verschwindet
const FADE = 0.6;               // s Ausblendzeit am Ende
const SUBSTEP = 1 / 240;        // fixe Physik-Schrittweite (verhindert Tunneling)

const GREEN = new THREE.Color(0x3fd15f);
const RED = new THREE.Color(0xe0453a);

/**
 * Ball-Werfen im Rundgang. `ringEl` ist das Crosshair-Ring-Overlay; es bekommt
 * `--charge` (0..1), `--ring-color` und die Klasse `active` während des Ladens.
 */
export function createBalls(scene, camera, ringEl) {
  const geo = new THREE.SphereGeometry(BALL_R, 16, 12);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xd6e34c, roughness: 0.85, metalness: 0 });
  const balls = [];               // { mesh, pos, vel, resting, age }
  let now = 0;
  let charging = false;
  let chargeStart = 0;
  let lastThrow = -Infinity;

  function startCharge() {
    if (charging) return;
    if (now - lastThrow < THROW_COOLDOWN) return;   // Cooldown aktiv
    charging = true;
    chargeStart = now;
  }

  function cancel() {
    charging = false;
    ringEl.classList.remove('active');
  }

  function release() {
    if (!charging) return;
    charging = false;
    ringEl.classList.remove('active');
    const t = Math.min(1, (now - chargeStart) / CHARGE_TIME);
    const speed = SPEED_MIN + t * (SPEED_MAX - SPEED_MIN);
    spawn(speed);
    lastThrow = now;
  }

  function spawn(speed) {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    const origin = camera.position.clone().addScaledVector(forward, 0.5);
    origin.y -= 0.2;                                 // knapp unter Augenhöhe abwerfen
    const mesh = new THREE.Mesh(geo, baseMat.clone());
    mesh.position.copy(origin);
    mesh.castShadow = true;
    scene.add(mesh);
    balls.push({
      mesh,
      pos: { x: origin.x, y: origin.y, z: origin.z },
      vel: { x: forward.x * speed, y: forward.y * speed, z: forward.z * speed },
      resting: false,
      age: 0,
    });
  }

  function updateRing() {
    if (!charging) { ringEl.classList.remove('active'); return; }
    const t = Math.min(1, (now - chargeStart) / CHARGE_TIME);
    ringEl.classList.add('active');
    ringEl.style.setProperty('--charge', String(t));
    ringEl.style.setProperty('--ring-color', '#' + GREEN.clone().lerp(RED, t).getHexString());
  }

  function update(dt) {
    now += dt;
    updateRing();

    // Physik in festen Sub-Schritten (stabil gegen Tunneling durch dünne Wände).
    const steps = Math.max(1, Math.min(8, Math.ceil(dt / SUBSTEP)));
    const sub = dt / steps;

    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      b.age += dt;
      for (let s = 0; s < steps; s++) stepBall(b, sub, groundHeight, colliders);
      b.mesh.position.set(b.pos.x, b.pos.y, b.pos.z);

      // Ausblenden gegen Ende der Lebensdauer.
      const remaining = LIFETIME - b.age;
      if (remaining < FADE) {
        b.mesh.material.transparent = true;
        b.mesh.material.opacity = Math.max(0, remaining / FADE);
      }
      if (b.age >= LIFETIME) {
        scene.remove(b.mesh);
        b.mesh.material.dispose();               // geklontes Material; geo ist geteilt (nicht disposen)
        balls.splice(i, 1);
      }
    }
  }

  return { update, startCharge, release, cancel };
}
```

- [ ] **Step 2: Syntax-Check + Commit**

Run: `node --check js/balls.js && echo OK`
Expected: `OK` (Laufzeit-Test folgt in Task 4 im Browser, da THREE/DOM nötig sind.)

```bash
git add js/balls.js
git commit -m "feat(ball): Ball-System (Laden/Werfen/Physik/Lebensdauer)"
```

---

### Task 4: Ring-HUD + Verdrahtung in main.js + manueller Test

**Files:**
- Modify: `index.html` (Ring-Div + CSS)
- Modify: `js/main.js` (Instanz, Loop, Maus-Events)

**Interfaces:**
- Consumes: `createBalls` aus `./balls.js`; `#power-ring` aus `index.html`; `renderer.domElement`, `camera`, `scene`, `player` aus `main.js`.

- [ ] **Step 1: Ring-Overlay + CSS in index.html**

Modify `index.html`: direkt nach `<div id="crosshair"></div>` (Zeile 79) einfügen:

```html
  <div id="power-ring"></div>
```

Und im `<style>`-Block direkt nach der `body.locked #crosshair { opacity: 1; }`-Regel (Zeile 21) einfügen:

```css
    /* Ladeanzeige als Ring um das Crosshair */
    #power-ring {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 42px; height: 42px; border-radius: 50%;
      background: conic-gradient(var(--ring-color, #3fd15f) calc(var(--charge, 0) * 360deg), rgba(255,255,255,0.14) 0);
      -webkit-mask: radial-gradient(farthest-side, transparent 60%, #000 62%);
              mask: radial-gradient(farthest-side, transparent 60%, #000 62%);
      opacity: 0; transition: opacity .12s; pointer-events: none; z-index: 5;
    }
    #power-ring.active { opacity: .95; }
```

- [ ] **Step 2: Ball-System in main.js einbinden**

Modify `js/main.js`: oben bei den Imports, direkt nach `import { createPlayer } from './player.js';` (Zeile 7), ergänzen:

```js
import { createBalls } from './balls.js';
```

Und nach `scene.add(camera);` (Zeile 61) ergänzen:

```js
// --- Ball werfen (linke Maustaste laden/loslassen) ---
const powerRing = document.getElementById('power-ring');
const balls = createBalls(scene, camera, powerRing);
const dom = renderer.domElement;
const isLocked = () => document.pointerLockElement === dom;
dom.addEventListener('mousedown', (e) => { if (e.button === 0 && isLocked()) balls.startCharge(); });
window.addEventListener('mouseup', (e) => { if (e.button === 0) balls.release(); });
// Ladung abbrechen (nicht werfen), wenn der Pointer-Lock verloren geht.
document.addEventListener('pointerlockchange', () => { if (!isLocked()) balls.cancel(); });
window.addEventListener('blur', () => balls.cancel());
```

- [ ] **Step 3: Ball-Update in den Render-Loop**

Modify `js/main.js`, in `animate()` (Zeile 147-152), ersetze:

```js
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  player.update(dt);
  renderer.render(scene, camera);
}
```

durch:

```js
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  player.update(dt);
  balls.update(dt);
  renderer.render(scene, camera);
}
```

- [ ] **Step 4: Syntax-Check**

Run: `node --check js/main.js && echo OK`
Expected: `OK`

- [ ] **Step 5: Manueller Test im Rundgang (lokaler statischer Server)**

Run: `cd /home/stephan/Dokumente/TCW3D/3DTCW && python3 -m http.server 8182 --bind 127.0.0.1`
Dann `http://localhost:8182/` in Chrome öffnen, „Rundgang starten", und prüfen:
- Linke Maustaste halten → Ring ums Crosshair füllt sich grün→rot; loslassen → Ball fliegt in Blickrichtung.
- Länger halten = weiter; höher schauen = Lob.
- Ball titscht realistisch auf dem Platz und kommt zur Ruhe.
- Ball prallt an der Umzäunung/Wand ab; fliegt über ein Tennisnetz; landet ggf. auf einer Bank.
- Max ~1 Wurf/Sekunde; Ball verschwindet nach ~8 s.
Server danach beenden (Ctrl-C).

- [ ] **Step 6: Commit**

```bash
git add index.html js/main.js
git commit -m "feat(ball): Ring-HUD + Maus-Steuerung im Rundgang verdrahtet"
```

---

### Task 5: Vendoring in den Monorepo-Snapshot

**Files:**
- Modify: `apps/waidcup-public/public/tcw3d/**` (im Monorepo, via Sync-Script)

- [ ] **Step 1: Snapshot synchronisieren**

Run: `cd /home/stephan/Dokumente/IC_Webseite_Claude && npm run sync:tcw3d`
Expected: „3D-App synchronisiert …". Danach ist `apps/waidcup-public/public/tcw3d/js/balls.js` etc. vorhanden.

- [ ] **Step 2: CSP-Importmap-Hash unverändert prüfen**

Run: `cd /home/stephan/Dokumente/IC_Webseite_Claude && npm run test -w @tcw/waidcup-public 2>/dev/null; grep -c "type=\"importmap\"" apps/waidcup-public/public/tcw3d/index.html`
Expected: Der Importmap-Block ist unverändert (wir haben ihn nicht angefasst) → CSP-Guard bleibt grün.

- [ ] **Step 3: Commit (Monorepo)**

```bash
cd /home/stephan/Dokumente/IC_Webseite_Claude
git add apps/waidcup-public/public/tcw3d
git commit -m "chore(waidcup): 3D-Snapshot – Tennisball werfen"
```

---

## Self-Review

**Spec-Abdeckung:**
- LMB laden/werfen, Ring-HUD → Task 3 (`startCharge/release`, `updateRing`) + Task 4 (Ring-DOM/CSS, Maus-Events). ✓
- Länger = weiter (Ladung→Geschwindigkeit), Ladezeit 1,2 s, Cooldown 1 s → Task 3 Konstanten. ✓
- Wurf in Blickrichtung, Abwurf vor/unter Kamera → Task 3 `spawn`. ✓
- Physik Boden-Bounce (Restitution/Reibung/Ruhe) → Task 1 `stepBall`. ✓
- Hindernis-Bounce mit Höhe (`top`), Überfliegen/Seitenabprall/Landen → Task 1 `resolveBox` + Task 2 `top`. ✓
- Feste Lebensdauer ~8 s mit Ausblenden → Task 3 `update`. ✓
- Spieler-Kollision unverändert → Task 2 (`resolveCollisions` ignoriert `top`). ✓
- Desktop-only, kein Sound, kein Ball↔Ball → nicht implementiert (YAGNI). ✓
- Unit-Tests für reine Physik → Task 1. ✓

**Platzhalter-Scan:** Keine TBD/TODO; jeder Code-Schritt zeigt vollständigen Code.

**Typ-Konsistenz:** `state {pos,vel,resting}` einheitlich zwischen `stepBall` (Task 1) und `balls.js` (Task 3, `balls.push({...})`). `addBox(...,top)` (Task 2) und `resolveBox`-Nutzung von `b.top` (Task 1) stimmen überein. `createBalls(scene,camera,ringEl)` (Task 3) = Aufruf in main.js (Task 4).
