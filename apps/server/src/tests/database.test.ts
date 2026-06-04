import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { appDb } from '../db/database.js';

describe('appDb.upsertContact', () => {
  it('preserves existing display_name when next upsert has null name', async () => {
    const contactId = `preserve-null-${Date.now()}@s.whatsapp.net`;

    await appDb.upsertContact(contactId, 'Nama Awal');
    await appDb.upsertContact(contactId, null);

    const contact = await appDb.getContact(contactId);
    assert.ok(contact);
    assert.equal(contact.name, 'Nama Awal');
  });

  it('preserves existing display_name when next upsert has different name', async () => {
    const contactId = `preserve-different-${Date.now()}@s.whatsapp.net`;

    await appDb.upsertContact(contactId, 'Nama Dashboard');
    await appDb.upsertContact(contactId, 'Nama PushName');

    const contact = await appDb.getContact(contactId);
    assert.ok(contact);
    assert.equal(contact.name, 'Nama Dashboard');
  });

  it('fills display_name when existing value is empty', async () => {
    const contactId = `fill-empty-${Date.now()}@s.whatsapp.net`;

    await appDb.createContact({ id: contactId, name: null });
    await appDb.upsertContact(contactId, 'Nama Baru');

    const contact = await appDb.getContact(contactId);
    assert.ok(contact);
    assert.equal(contact.name, 'Nama Baru');
  });
});

describe('appDb personal memories', () => {
  it('stores and clears memories per scoped contact id', async () => {
    const contactId = `group@g.us::62812${Date.now()}@s.whatsapp.net`;

    await appDb.upsertPersonalMemory(contactId, {
      key: 'preferred_name',
      value: 'Bima',
      confidence: 0.95,
      sourceMessageId: 'msg-1'
    });

    const memories = await appDb.listPersonalMemories(contactId);
    assert.equal(memories.length, 1);
    assert.equal(memories[0]?.key, 'preferred_name');
    assert.equal(memories[0]?.value, 'Bima');

    await appDb.clearPersonalMemories(contactId);
    assert.deepEqual(await appDb.listPersonalMemories(contactId), []);
  });
});
