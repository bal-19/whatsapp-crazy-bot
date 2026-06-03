import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectIntent } from '../ai/intent-detector.js';

describe('detectIntent', () => {
  it('detects reset', () => {
    assert.equal(detectIntent('/reset'), 'reset');
    assert.equal(detectIntent('mulai dari awal ya'), 'reset');
  });

  it('detects handoff', () => {
    assert.equal(detectIntent('bicara dengan manusia'), 'handoff');
  });

  it('returns normal by default', () => {
    assert.equal(detectIntent('halo'), 'normal');
  });
});
