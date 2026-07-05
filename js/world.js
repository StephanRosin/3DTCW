import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

/** Create the scene with fog tuned to blend the forest into a hazy horizon. */
export function createScene() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xbcd6ef, 130, 340);
  return scene;
}

/** Physically-ish sky with a sun, matching the bright blue clear-day screenshots. */
export function createSky(scene) {
  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  const u = sky.material.uniforms;
  u.turbidity.value = 2.4;
  u.rayleigh.value = 1.7;
  u.mieCoefficient.value = 0.004;
  u.mieDirectionalG.value = 0.8;

  // Sun high in the sky (clear summer noon).
  const sun = new THREE.Vector3();
  const elevation = 55;   // degrees above horizon
  const azimuth = 150;    // degrees
  const phi = THREE.MathUtils.degToRad(90 - elevation);
  const theta = THREE.MathUtils.degToRad(azimuth);
  sun.setFromSphericalCoords(1, phi, theta);
  u.sunPosition.value.copy(sun);

  return sun;
}

/** Sun (directional) + sky/hemisphere fill light, with shadows. */
export function createLights(scene, sunDir) {
  const hemi = new THREE.HemisphereLight(0xdcecff, 0x5a6b3a, 0.85);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff3e0, 2.4);
  sun.position.copy(sunDir).multiplyScalar(160);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const s = 130;
  sun.shadow.camera.left = -s;
  sun.shadow.camera.right = s;
  sun.shadow.camera.top = s;
  sun.shadow.camera.bottom = -s;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 420;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  scene.add(sun.target);

  return sun;
}

/** Large grassy ground plane with a subtly mottled canvas texture. */
export function createGround(scene) {
  const size = 800;
  const tex = grassTexture();
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(size / 8, size / 8);
  tex.anisotropy = 8;

  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 });
  const geo = new THREE.PlaneGeometry(size, size);
  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  return ground;
}

function grassTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#5f8a3a';
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const shade = Math.random();
    if (shade < 0.5) g.fillStyle = 'rgba(70,110,45,0.55)';
    else if (shade < 0.8) g.fillStyle = 'rgba(110,150,70,0.5)';
    else g.fillStyle = 'rgba(45,70,30,0.5)';
    g.fillRect(x, y, 1.6, 1.6);
  }
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}
