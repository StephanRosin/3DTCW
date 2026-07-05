# TCW 3D-Rundgang v2 — Design

**Datum:** 2026-07-05
**Status:** Vom Auftraggeber freigegeben (Interview am 2026-07-05)

## Ziel

Den bestehenden begehbaren 3D-Rundgang der Tennisanlage TC Waidberg (Repo
`StephanRosin/3DTCW`) deutlich realistischer machen und das Layout an die
echte Anlage angleichen. Referenz sind die Fotos in
`/home/stephan/Dokumente/TCW3D/` (TCW1–TCW10) sowie die Logo-Dateien
`TCW Logo.jpg` und `Waidcup2.png`.

## Scope

**Enthalten:** 6 Sandplätze in einer Reihe, Eingangsportal mit Steinbogen und
Logos, Klubhaus mit Pergola-Terrasse, Tribünenstufen, Wald ringsum,
Info-Punkte, Desktop-Steuerung.

**Nicht enthalten:** Restaurant-/Nebengebäude, Parkplatz, blauer
Multisportplatz, Boccia-Bahn, Zürich-Panorama, Mobile/Touch-Steuerung,
Ball-Physik, Tag/Nacht-Umschalter, Backend jeglicher Art.

## Anlagen-Layout (nach Luftaufnahmen TCW4/TCW5)

- **6 Sandplätze in einer Reihe** (nicht 3×2 wie in v1), Längsachse der
  Platzreihe verläuft Ost–West. Korrekte Spielfeldlinien (23,77 m × 10,97 m,
  Doppel), rote Sandfläche mit ausreichend Auslauf.
- **Umzäunung:** Maschendrahtzaun um den gesamten Platzblock, grüne
  Windschutzblachen, an mehreren Stellen Sponsorenbanner (generisch
  angedeutete Sponsoren, dazu TCW-/Waidcup-Logos). Flutlichtmasten an den
  Zaunlinien wie auf den Fotos.
- **Klubhaus:** langes Holzgebäude (dunkle Holzlattenfassade, weisse
  Fensterbänder, flach geneigtes Dach) nordwestlich parallel zur Platzreihe.
- **Pergola-Terrasse** vor dem Klubhaus: Pflastersteinboden, Pergola mit
  Wein-Bewuchs, Tische, Stühle, rote Sonnenschirme, Blumenkübel, Hecken.
- **Tribünenstufen** (Sitzstufen aus Holz/Beton) zwischen Terrassenniveau und
  Platzniveau; Rasenstreifen mit Bänken entlang der Plätze.
- **Eingang** (wie TCW6 rechts unten): Steinbogen-Portal mit rundem
  **TCW-Logo** an der Mauer und **Waidcup-Fahne** an einem Fahnenmast
  daneben; angrenzend die Holzhütte mit Pultdach. Der Spieler startet
  aussen vor dem Eingang und betritt die Anlage durch den Bogen.
- **Wald:** dichter, gemischter Wald (Laub- und Nadelbäume) rund um die
  Anlage, per InstancedMesh für Performance.

## Realismus (Hybrid-Ansatz)

- **Texturen:** CC0-PBR-Texturen (z.B. Poly Haven), lokal ins Repo unter
  `assets/textures/` gelegt: roter Tennissand, Rasen, Pflaster, Holz
  (Fassade/Möbel), Beton/Stein (Bogen, Stufen), Maschendraht (Alpha-Map),
  Windschutz-Gewebe. Auflösung max. 1K–2K, Zielgrösse Repo-Zuwachs ≤ 20 MB.
- **Logos:** `TCW Logo.jpg` (rund, freigestellt auf Kreisscheibe) an der
  Eingangsmauer; `Waidcup2.png` als Fahne/Banner am Eingang. Kopien liegen
  unter `assets/logos/`.
- **Licht:** Sky-Shader (Sommertag) wie v1, verbesserte Schatteneinstellung,
  Materialien mit roughness/normal-Maps.
- **Platz-Details:** Netz mit durchhängender Netzkante und Netzpfosten,
  Schiedsrichterstühle, Schleppnetz-Ständer, Linienbesen, Ballkörbe auf
  einzelnen Plätzen, Bänke und rote Schirme am Platzrand.

## Info-Punkte

- 3–4 Marker (dezent schwebendes „i") an: Eingang (Club seit 1932),
  Waidcup-Fahne (Turnier seit 1959, nächste Austragung 18.–26. Juli 2026),
  Klubhaus/Terrasse, Platz 1.
- Bei Annäherung (< ~3 m) erscheint ein Hinweis „E — Info"; Taste **E**
  öffnet/schliesst eine kleine HTML-Textkarte (Overlay, kein 3D-Text).
- Texte werden als Vorschlag verfasst und sind in einem eigenen Modul
  (`js/infopoints.js`) leicht editierbar.

## Technik

- **Stack unverändert:** Vanilla Three.js (lokal unter `vendor/`),
  ES-Module, kein Build-Tool, statisch servierbar.
- **Modulstruktur:**
  - `js/main.js` — Szenenaufbau, Verdrahtung, Game-Loop
  - `js/world.js` — Himmel, Licht, Boden
  - `js/tennis.js` — Platzreihe 1×6, Zaun, Banner, Flutlicht
  - `js/props.js` — Klubhaus, Terrasse, Möbel, Wald, Tribüne
  - `js/entrance.js` — **neu:** Steinbogen, Logos, Fahne, Hütte
  - `js/infopoints.js` — **neu:** Info-Marker + Overlay-Logik
  - `js/textures.js` — **neu:** Texture-Loader-Helfer (PBR-Sets, Fallback-Farbe
    solange Textur lädt)
  - `js/player.js`, `js/collision.js` — Steuerung/Kollision, an neues Layout
    angepasst
- **Steuerung:** Desktop only. WASD/Pfeile, Maus (Pointer Lock),
  Shift = rennen, E = Info, ESC = Menü.
- **Performance-Ziel:** flüssig (~60 fps) auf normalem Desktop; Bäume
  instanziert, Schattenkarte begrenzt, Texturen ≤ 2K.

## Fehlerbehandlung

- Fehlende/nicht ladbare Texturen: Material fällt auf eine passende
  Grundfarbe zurück (kein schwarzes Mesh, kein Absturz).
- Pointer-Lock-Abbruch (ESC/Fokusverlust): Menü-Overlay erscheint wieder,
  Zustand bleibt konsistent (wie v1).

## Test & Verifikation

- Manuelle Verifikation per lokalem Server (`python3 -m http.server`) und
  Playwright: Screenshots von Startbildschirm, Eingang mit beiden Logos,
  Platzreihe, Terrasse; Konsole frei von Fehlern.
- Kollisionscheck: Spieler kann nicht durch Zäune, Gebäude, Mauern laufen;
  Durchgang durch den Eingangsbogen funktioniert.

## Bereitstellung

- Lokal: statischer Server aus dem Repo-Ordner
  `/home/stephan/Dokumente/TCW3D/3DTCW`, Aufruf `http://localhost:8000`.
- Commits lokal im geklonten Repo; Push zu GitHub nur auf Wunsch.
