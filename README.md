# 🎾 3D Tennisclub — Rundgang

Ein begehbarer 3D-Rundgang durch die Tennisanlage des TC Waidberg, direkt im
Browser, in Ego-Perspektive.

Der Rundgang startet auf der Vorplatz-Plaza vor einer Holzfassade wie das
Klubhaus, mit einem Bogen-Durchgang (TCW-Rondell und grossem Waidcup-Plakat
daneben). Durch den Bogen erreicht man die erhöhte TCW-Terrasse: eine
Bar-Nische hinter einer hohen Holzwand (Zapfhahn + 2 Kühlschränke), 4
Recht­ecktische unter einer berankten Pergola, ein Rundtisch sowie 4
freistehende Bildschirme mit Blick auf die Plätze (vorbereitet für eine
künftige Begleit-WebApp, siehe `window.__tcw.setScreen` unten). Eine
schmale Treppe mit Geländer führt von der Terrasse hinunter zum Tor
zwischen Platz 1 und 2; östlich davon liegt ein begehbarer halbhoher
Rasen, der über einen kurzen Heckendurchgang mit Kurztreppe erreichbar
ist. Dahinter liegen **6 Sandplätze** in einer Reihe, in einer gemeinsamen
Umzäunung (Kettenzaun nur auf der Nordseite), grünem Windschutz mit
WAIDCUP-/TCW-/Waidcup-Logo-Bannern auf Süd-, West- und Ostseite,
rückenlosen Bänken und roten Sonnenschirmen zwischen den Plätzen,
Schleppnetzen/Besen/Bällen und Flutlichtmasten — es gibt nur **ein Tor**
(zwischen Platz 1 und 2). Östlich der Plaza liegt das Restaurant „TESSIN
GROTTO" (hinter den Plätzen 4–6) mit eigener Terrasse (Tische, rote
Sonnenschirme), durch ein niedriges Mäuerchen mit einer Öffnung vom
seitlichen Fussweg getrennt. Ein Geländer läuft hinter den Gebäuden
entlang. Rings um die ganze Anlage wächst ein dichter, artenreicher Wald
aus Nadel-, Laub- und hohen Fichtenbäumen.

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
  audio.js                Terrassen-Musik (positionaler Lautsprecher an der Bar-Wand)
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

`i` läuft von `0` (Ost) bis `3` (West). Die Panels starten mit einem
dunklen Platzhaltermaterial (Farbe `0x0d1420`, kein Map); `setScreen`
setzt die Materialfarbe beim Zuweisen eines Maps auf Weiss zurück (sonst
multipliziert three.js Map × Farbe und der Bildschirm bliebe fast
schwarz). Ein selbst erzeugtes Texture-Objekt (aus Canvas/Video/Image)
wird beim nächsten Aufruf automatisch entsorgt (`dispose()`); ein
übergebenes `THREE.Texture`-Objekt gehört weiterhin dem Aufrufer und wird
nie von hier aus entsorgt. `setScreen(i, null)` setzt den Platzhalter
zurück (Map weg, Farbe wieder `0x0d1420`). Ein ungültiger Index wird mit
einer Konsolen-Warnung quittiert, ohne zu werfen.

## Musik

Die Terrassen-Musik (`js/audio.js`) erwartet zwei lokale Dateien unter
`assets/audio/track1.mp3` und `assets/audio/track2.mp3`. Diese sind
**nicht** im Repo enthalten (per `.gitignore` ausgeschlossen) — ohne sie
läuft die Anlage ganz normal, es erscheint lediglich eine
Konsolen-Warnung (`[audio] track … unavailable`). Wer Musik hören
möchte, legt einfach zwei eigene MP3-Dateien unter genau diesen Namen
in `assets/audio/` ab.

## Texturen & Assets

Alle PBR-Texturen sind CC0 und stammen von [Poly Haven](https://polyhaven.com)
— frei verwendbar, keine Namensnennung erforderlich. Fehlt eine Textur-Datei,
fällt das jeweilige Material automatisch auf eine einfache Vertex-Farbe
zurück (siehe `js/textures.js`), die Anlage bleibt darstellbar.
