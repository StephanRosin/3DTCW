# 🎾 3D Tennisclub — Rundgang

Ein begehbarer 3D-Rundgang durch die Tennisanlage des TC Waidberg, direkt im
Browser, in Ego-Perspektive.

Der Rundgang startet auf der Vorplatz-Plaza vor einem steinernen Torbogen
(mit TCW-Rondell und grossem Waidcup-Plakat). Durch den Bogen erreicht man
die erhöhte TCW-Terrasse: eine Bar-Nische hinter einer hohen Holzwand
(Zapfhahn + 2 Kühlschränke), 4 Recht­ecktische unter einer berankten
Pergola, ein Rundtisch sowie 4 freistehende Bildschirme mit Blick auf die
Plätze (vorbereitet für eine künftige Begleit-WebApp, siehe
`window.__tcw.setScreen` unten). Tribünenstufen führen von der Terrasse
hinunter zum Tor zwischen Platz 1 und 2. Dahinter liegen **6 Sandplätze**
in einer Reihe, in einer gemeinsamen Umzäunung (Kettenzaun nur auf der
Nordseite), grünem Windschutz mit WAIDCUP-/TCW-/Waidcup-Logo-Bannern auf
Süd-, West- und Ostseite, rückenlosen Bänken und roten Sonnenschirmen
zwischen den Plätzen, Schleppnetzen/Besen/Bällen und Flutlichtmasten; ein
zweites Tor im Osten (Platz 6) führt zur Wiese. Östlich der Plaza liegt das
Restaurant „TESSIN GROTTO" (hinter den Plätzen 4–6) mit eigener Terrasse
(Tische, rote Sonnenschirme), durch ein niedriges Mäuerchen mit einer
Öffnung vom seitlichen Fussweg getrennt. Ein Geländer läuft hinter den
Gebäuden entlang. Rings um die ganze Anlage wächst ein dichter, artenreicher
Wald aus Nadel-, Laub- und hohen Fichtenbäumen.

Gebaut mit [Three.js](https://threejs.org) (WebGL) — komplett clientseitig,
ohne Backend.

## Steuerung

| Taste | Aktion |
|-------|--------|
| **W A S D** / Pfeiltasten | Laufen |
| **Maus** | Umschauen (Pointer Lock) |
| **Shift** | Rennen |
| **ESC** | Mauszeiger freigeben / Menü |

Klick auf **„Rundgang starten"** aktiviert den Maus-Zeiger-Lock (Pointer Lock).

## Starten

Da das Projekt ES-Module verwendet, muss es über einen **HTTP-Server**
ausgeliefert werden (direktes Öffnen der `index.html` per `file://` klappt
bei Modulen nicht):

```bash
python3 -m http.server 8000
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
assets/
  textures/             CC0-PBR-Texturen (Poly Haven): Sand, Gras, Stein, Holz, Beton, ...
  logos/                TCW-Logo, Waidcup-Plakat
js/
  main.js               Aufbau der Szene, Möblierung, Game-Loop, window.__tcw-API
  world.js               Himmel, Sonne/Licht, Nebel, Boden
  tennis.js              Plätze, Netze, Zaun, Banner/Logos, Flutlicht, 6er-Platzreihe
  props.js               Klubhaus, Restaurant, Pergola, Möbel, Terrassen-Plateau, Wald
  entrance.js             Torbogen, TCW-Rondell, Waidcup-Plakat, Vorplatz
  screens.js              4 freistehende Bildschirme auf der Terrasse
  player.js               Ego-Steuerung (Pointer Lock) + Bewegung
  collision.js            Einfache Kollision + Bodenhöhen-Modell (Plateau/Rampen)
  textures.js             PBR-Material-Helper mit Textur-Fallback
```

## Anpassen

- **Banner-/Sponsorentexte** (WAIDCUP, Turnierdatum): `js/tennis.js`
  (`WAIDCUP_BANNER` und die Banner-Aufbaufunktion)
- **Baumdichte / Waldradius**: `buildForest(scene, count, innerR, outerR)`
  in `js/main.js` (aktuell 650 Bäume, Ring 75–220 m ab Zentrum)
- **Farben** (Sand, Zaun, Gras, Himmel): jeweils oben in den Modulen
- **Layout-Konstanten**: `ENC` (Platz-Umzäunung) in `js/tennis.js`,
  `PLATEAU`/`RAMPS` (Terrassenhöhe, Rampen) in `js/collision.js`

### Bildschirm-API (für eine künftige Begleit-WebApp)

Die 4 Terrassen-Bildschirme lassen sich zur Laufzeit mit beliebigem Inhalt
befüllen — Canvas, Bild, Video oder ein fertiges `THREE.Texture`:

```js
const canvas = document.querySelector('#my-canvas');
window.__tcw.setScreen(0, canvas);   // Bildschirm 0 (ost) zeigt jetzt das Canvas
// window.__tcw.setScreen(i, videoEl) oder (i, imgEl) funktionieren genauso
```

`i` läuft von `0` (Ost) bis `3` (West); die vorherige Textur wird beim
Wechsel automatisch entsorgt (`dispose()`).

## Texturen & Assets

Alle PBR-Texturen sind CC0 und stammen von [Poly Haven](https://polyhaven.com)
— frei verwendbar, keine Namensnennung erforderlich. Fehlt eine Textur-Datei,
fällt das jeweilige Material automatisch auf eine einfache Vertex-Farbe
zurück (siehe `js/textures.js`), die Anlage bleibt darstellbar.
