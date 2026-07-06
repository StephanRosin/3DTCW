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
