# 🎾 3D Tennisclub — Rundgang

Ein begehbarer 3D-Rundgang durch unsere Tennisanlage, direkt im Browser.
Man startet am Tisch auf der Terrasse und kann in der Ego-Perspektive über
die ganze Anlage laufen: **6 Sandplätze** in einem 3×2-Block, mit grünen
Windschutz­zäunen, Netzen, Flutlichtmasten, Klubhaus mit Pergola-Terrasse
(Tische, Stühle, Sonnenschirme, Bänke, Hecken) und einem Wald ringsherum.

Gebaut mit [Three.js](https://threejs.org) (WebGL) — komplett clientseitig,
ohne Backend.

## Steuerung

| Taste | Aktion |
|-------|--------|
| **W A S D** / Pfeiltasten | Laufen |
| **Maus** | Umschauen |
| **Shift** | Rennen |
| **ESC** | Mauszeiger freigeben / Menü |

Klick auf **„Rundgang starten"** aktiviert den Maus-Zeiger-Lock (Pointer Lock).

## Starten

Da das Projekt ES-Module verwendet, muss es über einen **HTTP-Server**
ausgeliefert werden (direktes Öffnen der `index.html` per `file://` klappt
bei Modulen nicht). Ein beliebiger statischer Server genügt:

```bash
# Variante 1: Python (fast überall vorhanden)
python3 -m http.server 8000

# Variante 2: Node
npx serve .
```

Dann im Browser öffnen: <http://localhost:8000>

### Hosting

Es sind nur statische Dateien — man kann den Ordner unverändert auf
**GitHub Pages**, Netlify, Vercel o. Ä. legen und die Anlage läuft.
Three.js liegt lokal unter `vendor/` (kein CDN nötig, funktioniert offline).

## Projektstruktur

```
index.html              Einstieg, Start-Overlay, HUD, Importmap
vendor/                 Three.js (Core + PointerLockControls + Sky), lokal
js/
  main.js               Aufbau der Szene, Möblierung, Game-Loop
  world.js              Himmel, Sonne/Licht, Boden
  tennis.js             Platz, Netz, Zaun, Flutlicht, 3×2-Layout der 6 Plätze
  props.js              Klubhaus, Pergola, Tische/Stühle, Schirme, Bänke, Hecken, Wald
  player.js             Ego-Steuerung (Pointer Lock) + Bewegung
  collision.js          Einfache Kollision gegen Zäune/Gebäude/Möbel
```

## Anpassen

- **Startpunkt** und Möblierung der Terrasse: `js/main.js`
- **Platz-Layout / Anzahl Flutmasten**: `buildCourtBlock()` in `js/tennis.js`
- **Farben** (Sand, Zaun, Gras, Himmel): jeweils oben in den Modulen
- **Baumdichte / Waldradius**: `buildForest(scene, count, innerR, outerR)` in `js/main.js`

Die Anordnung ist an die beiden Luftaufnahmen der Anlage angelehnt
(6 Sandplätze im Block, Klubhaus/Terrasse davor, Wald ringsum).
