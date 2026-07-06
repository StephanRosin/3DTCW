# Tennisball werfen – Design

**Ziel:** Im 3D-Rundgang mit der linken Maustaste einen Tennisball in Blickrichtung
werfen (länger drücken = weiter), mit realistischer Aufprall-Physik und einer
Aufladeanzeige als Ring um das Crosshair.

**Kontext:** Vanilla Three.js (r160, Importmap, kein Build). Render-Loop in
`main.js` (`player.update(dt); renderer.render()`). Kollision über
`collision.js` (`groundHeight(x,z)`, `colliders[]`, `resolveCollisions`).
Crosshair/HUD sind HTML-Overlays in `index.html`. Desktop-only (die Tour zeigt
auf Mobile einen Hinweis).

## Steuerung & Aufladen

- **Linke Maustaste halten** → lädt auf; **loslassen** → Wurf.
- Nur aktiv, wenn Pointer-Lock aktiv ist (`document.pointerLockElement === dom`).
  Im Drag-Fallback bleibt LMB fürs Umschauen → kein Konflikt. Der Re-Lock-Klick
  (wenn nicht gelockt) wirft nicht.
- **Ladeanzeige:** Ring um das Crosshair, füllt sich 0→100 % (Farbe grün→rot),
  nur während des Ladens sichtbar.
- **Ladezeit bis Max:** ~1,2 s (`CHARGE_TIME`). Länger halten bleibt bei Max
  (kein Overcharge/Oszillieren).
- **Ladung → Abwurfgeschwindigkeit:** linear `SPEED_MIN`≈6 → `SPEED_MAX`≈20 m/s.
- **Cooldown:** 1 s zwischen Würfen (`THROW_COOLDOWN`, „max 1 Ball/s"). Während
  des Cooldowns startet kein neues Laden.
- **Wurf:** Richtung = Kamera-Blickrichtung (`camera.getWorldDirection`, deckt
  sich mit dem Crosshair). Abwurfpunkt knapp vor und leicht unter der Kamera
  (`camPos + forward*0.5`, y −0.2), damit der Ball nicht in der Bildmitte klebt.
  Geradeaus = flacher Bogen, nach oben schauen = Lob.

## Physik (realistischer Tennisball, ohne Physik-Engine)

Zustand je Ball: `pos` (Vector3), `vel` (Vector3), `age`.

- **Integration:** `vel += g·dt` (g = 9,81 m/s² nach unten); leichter
  Luftwiderstand `vel *= (1 − DRAG·dt)` (DRAG klein, ~0,1). `pos += vel·dt`.
- **Ballradius** `R` ≈ 0,045 m (echter Tennisball 3,3 cm, leicht vergrößert für
  Sichtbarkeit). Restitution `E` ≈ 0,75, Tangentialreibung pro Bounce ≈ 0,8.
- **Boden-Bounce:** Bodenhöhe `h = groundHeight(x,z)`. Wenn `pos.y − R ≤ h` und
  `vel.y < 0`: `pos.y = h + R`; `vel.y = −vel.y·E`; horizontale Komponente
  `*= 0,8` (Reibung). Unterschreitet die Bounce-Höhe eine Schwelle und ist die
  Horizontalgeschwindigkeit klein → **Ruhe** (auf dem Boden liegen, kein Jitter).
- **Hindernis-Bounce (Kugel gegen AABB-Box):** Jede Box reicht vom Boden bis
  `top` (siehe unten). Nächster Punkt der Box zum Ballzentrum in x/y/z (y auf
  `[0, top]` geklemmt); bei Durchdringung < `R` entlang der Achse der geringsten
  Penetration herausschieben und die zugehörige Geschwindigkeitskomponente mit
  `−E` reflektieren. Damit: seitlich abprallen (unter `top`), oben landen
  (Bank), oder **drüber fliegen** (über `top` = keine Kollision).
- Kein Ball↔Ball, keine Spieler↔Ball-Kollision.

### Collider-Höhen (`collision.js`)

- `addBox(minX, minZ, maxX, maxZ, top = Infinity)` — neues optionales `top`.
  Default `Infinity` ⇒ volle Wand ⇒ `resolveCollisions` (Spieler) unverändert,
  und der Ball behandelt bestehende Zäune/Umzäunung/Clubhaus wie volle Barrieren.
- Niedrige Collider bekommen echte Höhen, damit der Ball sie überwerfen kann:
  Tennisnetze ≈ 1,07 m, Trennnetz Platz 4/5 = 2 m, Bänke ≈ 0,9 m. (Aufrufe in
  `tennis.js`/`props.js` entsprechend ergänzen.)

## Lebensdauer

- Jeder Ball verschwindet nach fester Zeit `LIFETIME` ≈ 8 s ab Wurf; die letzten
  ~0,6 s wird die Material-Opazität ausgeblendet, dann Mesh entfernen/disposen.
- Bei 1 Ball/s ⇒ höchstens ~8 gleichzeitig (kein separater Zähler nötig).

## Architektur

- **Neu `js/balls.js`:** `createBalls(scene, camera, ringEl)` →
  `{ update(dt), startCharge(), release() }`.
  - Besitzt einen Mesh-Pool (geteilte `SphereGeometry` + gelbes
    `MeshStandardMaterial`; je Ball eine Instanz für individuelle Opazität) und
    die Liste aktiver Bälle mit Physikzustand.
  - `startCharge()` merkt sich Ladebeginn (nur wenn Cooldown abgelaufen).
  - `release()` erzeugt bei gültiger Ladung einen Ball und startet den Cooldown.
  - `update(dt)`: Ladezustand → Ring-Element aktualisieren; alle Bälle über
    `stepBall` integrieren; Lebensdauer/Ausblenden/Entfernen.
- **Reine Physik `stepBall(state, dt, groundFn, colliders)`** (in `balls.js`
  exportiert): mutiert `pos`/`vel`, gibt Ruhezustand zurück. Ohne Three.js/DOM →
  **unit-testbar** mit `node --test` (Fall/Bounce mit E, Ruhe, Überfliegen einer
  Box mit `top`, seitlicher Abprall unter `top`).
- **`main.js`:** `balls.update(dt)` im Loop; `mousedown`/`mouseup` (button 0) auf
  `renderer.domElement`, geguardet auf Pointer-Lock, rufen
  `startCharge()`/`release()`. `blur`/Pointer-Lock-Verlust → Laden abbrechen.
- **`index.html`:** Ring-Div (`#power-ring`) mittig über dem Crosshair +
  CSS (conic-gradient für die Füllung); `balls.js` bekommt das Element und setzt
  Füllgrad/Farbe/Sichtbarkeit.

## Nicht enthalten (YAGNI)

Kein Spin/Slice, kein Sound, kein Mobile/Touch-Wurf, keine Ball↔Ball-Kollision,
keine Landefläche-Physik über die AABB-Reflexion hinaus.

## Test

- Automatisiert: `stepBall` als reine Funktion mit `node --test` (Bounce-Restitution,
  Ruhe-Schwelle, `top`-Überfliegen vs. seitlicher Abprall).
- Manuell im Rundgang: Wurfweite skaliert mit Ladung; Ring füllt sich; 1 Ball/s;
  Ball titscht auf Platz, prallt an Umzäunung ab, fliegt über ein Netz, landet auf
  einer Bank; verschwindet nach ~8 s.
