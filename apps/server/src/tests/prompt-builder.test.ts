import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDocumentSystemPrompt,
  buildSystemPrompt
} from '../ai/prompt-builder.js';

describe('buildSystemPrompt', () => {
  it('includes core rules, persona, WIB timestamp, and contact name', () => {
    const prompt = buildSystemPrompt({
      botName: 'Bot Gila',
      persona: 'Persona custom admin',
      toneStyle: 'pedas',
      contactName: 'Budi',
      personalMemorySummary: 'Nama panggilan yang disukai: Bima'
    });

    assert.match(prompt, /Aturan Inti/);
    assert.match(prompt, /Persona custom admin/);
    assert.match(prompt, /WIB/);
    assert.match(prompt, /Budi/);
    assert.match(prompt, /Bot Gila/);
    assert.match(prompt, /Nama panggilan yang disukai: Bima/);
  });

  it('builds a dedicated professional prompt for document generation', () => {
    const prompt = buildDocumentSystemPrompt({
      kind: 'pdf'
    });

    assert.match(prompt, /dokumen profesional/i);
    assert.match(prompt, /Abaikan persona chatbot/i);
    assert.match(prompt, /PDF/);
    assert.doesNotMatch(prompt, /Bot Gila/);
    assert.doesNotMatch(prompt, /Persona custom admin/);
  });
});
