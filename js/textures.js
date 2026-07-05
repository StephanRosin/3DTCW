import * as THREE from 'three';

const loader = new THREE.TextureLoader();

export function loadTex(path, { repeat = [1, 1], srgb = false, onError } = {}) {
  const tex = loader.load(path, undefined, undefined,
    () => {
      console.warn(`Textur fehlt: ${path} — Fallback-Farbe aktiv`);
      onError?.();
    });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 8;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** PBR-Material aus einem Textur-Set-Ordner (diff.jpg [+ nor.jpg]). */
export function pbr({ dir, color = 0xffffff, repeat = [1, 1], roughness = 1, metalness = 0, normalScale = 1 }) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  mat.map = loadTex(`${dir}/diff.jpg`, {
    repeat, srgb: true,
    onError: () => { mat.map = null; mat.needsUpdate = true; },
  });
  // Normal-Map nur setzen, wenn Datei existiert — Existenz zur Ladezeit unbekannt,
  // deshalb optimistisch setzen; onError entfernt sie wieder.
  const nor = loader.load(`${dir}/nor.jpg`,
    () => { mat.normalMap = nor; mat.normalScale.set(normalScale, normalScale); mat.needsUpdate = true; },
    undefined,
    () => {});
  nor.wrapS = nor.wrapT = THREE.RepeatWrapping;
  nor.repeat.set(repeat[0], repeat[1]);
  nor.anisotropy = 8;
  return mat;
}
