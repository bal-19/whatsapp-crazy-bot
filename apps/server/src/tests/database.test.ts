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
