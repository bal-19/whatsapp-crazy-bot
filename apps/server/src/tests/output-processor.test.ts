import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { processGeminiOutput } from '../ai/output-processor.js';

describe('processGeminiOutput', () => {
  it('strips markdown formatting', () => {
    assert.equal(processGeminiOutput('## Halo **Budi** `test`'), 'Halo Budi test');
  });

  it('normalizes whitespace', () => {
    assert.equal(processGeminiOutput('halo\n\n\nbot'), 'halo\n\nbot');
  });

  it('truncates long output', () => {
    const result = processGeminiOutput('Kalimat aman. '.repeat(100));
    assert.equal(result.length <= 800, true);
  });

  it('returns fallback for empty output', () => {
    assert.match(processGeminiOutput('   '), /Maaf/);
  });
});
