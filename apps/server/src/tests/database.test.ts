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

describe('appDb group metadata', () => {
  it('keeps contacts unique per participant even across different group scopes', async () => {
    const participantJid = `62888${Date.now()}@s.whatsapp.net`;
    const firstGroupContactId = `120363${Date.now()}@g.us::${participantJid}`;
    const secondGroupContactId = `120364${Date.now()}@g.us::${participantJid}`;

    await appDb.upsertContact(participantJid, 'Iqbal');
    await appDb.insertMessage({
      id: `group-msg-a-${Date.now()}`,
      contact_id: firstGroupContactId,
      direction: 'inbound',
      body: 'Ikmal halo dari grup A'
    });
    await appDb.insertMessage({
      id: `group-msg-b-${Date.now()}`,
      contact_id: secondGroupContactId,
      direction: 'inbound',
      body: 'Ikmal halo dari grup B'
    });

    const contacts = await appDb.listContacts();
    const participantContacts = contacts.filter((contact) => contact.id === participantJid);

    assert.equal(participantContacts.length, 1);

    const conversations = await appDb.listConversations();
    assert.equal(
      conversations.data.some((item) => item.contact_id === firstGroupContactId),
      true
    );
    assert.equal(
      conversations.data.some((item) => item.contact_id === secondGroupContactId),
      true
    );
  });

  it('adds group_name to scoped group conversation summaries', async () => {
    const groupJid = `120363${Date.now()}@g.us`;
    const participantJid = `62812${Date.now()}@s.whatsapp.net`;
    const contactId = `${groupJid}::${participantJid}`;

    await appDb.upsertGroup(groupJid, 'Grup Keluarga');
    await appDb.upsertContact(contactId, 'Bima');
    await appDb.insertMessage({
      id: `group-msg-${Date.now()}`,
      contact_id: contactId,
      direction: 'inbound',
      body: 'Ikmal halo'
    });

    const summaries = await appDb.listConversations();
    const summary = summaries.data.find((item) => item.contact_id === contactId);

    assert.ok(summary);
    assert.equal(summary.contact_name, 'Bima');
    assert.equal(summary.group_name, 'Grup Keluarga');

    const groups = await appDb.listGroups();
    const group = groups.find((item) => item.group_jid === groupJid);
    assert.ok(group);
    assert.equal(group.display_name, 'Grup Keluarga');
  });

  it('tracks group jid with null display_name without clearing an existing name', async () => {
    const groupJid = `120363-preserve-${Date.now()}@g.us`;

    const tracked = await appDb.upsertGroup(groupJid, null);
    assert.equal(tracked.group_jid, groupJid);
    assert.equal(tracked.display_name, null);

    await appDb.upsertGroup(groupJid, 'Nama Manual');
    const preserved = await appDb.upsertGroup(groupJid, null);

    assert.equal(preserved.display_name, 'Nama Manual');
  });

  it('deletes stored group metadata without removing the conversation scope', async () => {
    const groupJid = `120363-delete-${Date.now()}@g.us`;
    const participantJid = `62899${Date.now()}@s.whatsapp.net`;
    const contactId = `${groupJid}::${participantJid}`;

    await appDb.upsertGroup(groupJid, 'Grup Hapus');
    await appDb.insertMessage({
      id: `group-delete-msg-${Date.now()}`,
      contact_id: contactId,
      direction: 'inbound',
      body: 'halo grup hapus'
    });

    await appDb.deleteGroup(groupJid);

    const groups = await appDb.listGroups();
    assert.equal(groups.some((item) => item.group_jid === groupJid), false);

    const summaries = await appDb.listConversations();
    const summary = summaries.data.find((item) => item.contact_id === contactId);
    assert.ok(summary);
    assert.equal(summary.group_name, null);
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

  it('purges operational data without touching preserved domains', async () => {
    const contactId = `purge-${Date.now()}@s.whatsapp.net`;
    const groupJid = `120363-purge-${Date.now()}@g.us`;

    await appDb.upsertContact(contactId, 'Purge Test');
    await appDb.upsertGroup(groupJid, 'Purge Group');
    await appDb.insertMessage({
      id: `msg-${Date.now()}`,
      contact_id: contactId,
      direction: 'inbound',
      body: 'halo'
    });
    await appDb.upsertPersonalMemory(contactId, {
      key: 'preferred_name',
      value: 'Purge',
      confidence: 0.9
    });

    const summary = await appDb.purgeOperationalData();
    assert.equal(summary.contactsDeleted >= 1, true);
    assert.equal(summary.groupsDeleted >= 1, true);
    assert.equal(summary.messagesDeleted >= 1, true);
    assert.equal(summary.memoriesDeleted >= 1, true);
    assert.deepEqual(await appDb.listContacts(), []);
    assert.deepEqual(await appDb.listGroups(), []);
  });
});
