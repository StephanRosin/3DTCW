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
