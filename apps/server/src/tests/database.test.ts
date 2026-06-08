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
  it('exposes document metadata and includes it in analytics', async () => {
    const contactId = `document-analytics-${Date.now()}@s.whatsapp.net`;
    const before = await appDb.getAnalyticsSummary();

    await appDb.insertMessage({
      id: `document-outbound-${Date.now()}`,
      contact_id: contactId,
      direction: 'outbound',
      body: 'File laporan.pdf sudah dibuat.',
      latency_ms: 120,
      raw_payload: {
        reply_type: 'document',
        document_kind: 'pdf',
        file_name: 'laporan.pdf',
        mime_type: 'application/pdf'
      }
    });

    const detail = await appDb.getConversation(contactId);
    assert.equal(detail?.messages[0]?.raw_payload?.reply_type, 'document');
    assert.equal(detail?.messages[0]?.raw_payload?.file_name, 'laporan.pdf');

    const after = await appDb.getAnalyticsSummary();
    assert.equal(after.documents_today, before.documents_today + 1);
    assert.equal(after.documents_by_format.pdf, before.documents_by_format.pdf + 1);
    assert.equal(after.avg_document_latency_ms > 0, true);
  });

  it('preserves message timestamp separate from created_at for conversation ordering', async () => {
    const contactId = `timestamp-${Date.now()}@s.whatsapp.net`;
    const firstTimestamp = '2026-06-01T10:00:00.000Z';
    const secondTimestamp = '2026-06-01T10:05:00.000Z';

    await appDb.insertMessage({
      id: `msg-a-${Date.now()}`,
      contact_id: contactId,
      direction: 'inbound',
      body: 'pesan pertama',
      message_timestamp: firstTimestamp
    });
    await appDb.insertMessage({
      id: `msg-b-${Date.now()}`,
      contact_id: contactId,
      direction: 'outbound',
      body: 'pesan kedua',
      message_timestamp: secondTimestamp
    });

    const detail = await appDb.getConversation(contactId);
    assert.ok(detail);
    assert.equal(detail.messages[0]?.message_timestamp, firstTimestamp);
    assert.equal(detail.messages[1]?.message_timestamp, secondTimestamp);

    const summaries = await appDb.listConversations();
    const summary = summaries.data.find((item) => item.contact_id === contactId);
    assert.equal(summary?.last_message_at, secondTimestamp);
  });

  it('stores reply references without relying on message time', async () => {
    const contactId = `reply-ref-${Date.now()}@s.whatsapp.net`;
    const inboundId = `inbound-reply-ref-${Date.now()}`;

    await appDb.insertMessage({
      id: inboundId,
      contact_id: contactId,
      direction: 'inbound',
      body: 'pesan yang dibalas'
    });
    await appDb.insertMessage({
      id: `outbound-reply-ref-${Date.now()}`,
      contact_id: contactId,
      direction: 'outbound',
      body: 'balasan bot',
      reply_to_message_id: inboundId
    });

    const detail = await appDb.getConversation(contactId);
    assert.ok(detail);
    assert.equal(detail.messages[1]?.reply_to_message_id, inboundId);
  });

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

  it('hydrates group history across different member scopes when using the group jid', async () => {
    const groupJid = `120363-history-${Date.now()}@g.us`;
    const firstMemberScope = `${groupJid}::62812001@s.whatsapp.net`;
    const secondMemberScope = `${groupJid}::62812002@s.whatsapp.net`;

    await appDb.insertMessage({
      id: `group-history-a-${Date.now()}`,
      contact_id: firstMemberScope,
      direction: 'inbound',
      body: 'halo dari member pertama',
      message_timestamp: '2026-06-01T10:00:00.000Z'
    });
    await appDb.insertMessage({
      id: `group-history-b-${Date.now()}`,
      contact_id: secondMemberScope,
      direction: 'outbound',
      body: 'balasan ke grup',
      message_timestamp: '2026-06-01T10:01:00.000Z'
    });

    const history = await appDb.getRecentHistory(groupJid, 20);
    assert.equal(history.length, 2);
    assert.equal(history[0]?.contact_id, firstMemberScope);
    assert.equal(history[1]?.contact_id, secondMemberScope);
  });

  it('clears all member histories when a group-scoped reset targets the group jid', async () => {
    const groupJid = `120363-reset-${Date.now()}@g.us`;
    const firstMemberScope = `${groupJid}::62813001@s.whatsapp.net`;
    const secondMemberScope = `${groupJid}::62813002@s.whatsapp.net`;

    await appDb.insertMessage({
      id: `group-reset-a-${Date.now()}`,
      contact_id: firstMemberScope,
      direction: 'inbound',
      body: 'pesan pertama'
    });
    await appDb.insertMessage({
      id: `group-reset-b-${Date.now()}`,
      contact_id: secondMemberScope,
      direction: 'inbound',
      body: 'pesan kedua'
    });

    await appDb.clearConversation(groupJid);

    assert.deepEqual(await appDb.getRecentHistory(firstMemberScope, 20), []);
    assert.deepEqual(await appDb.getRecentHistory(secondMemberScope, 20), []);
    assert.deepEqual(await appDb.getRecentHistory(groupJid, 20), []);
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
