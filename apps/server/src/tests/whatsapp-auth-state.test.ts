import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createWhatsAppAuthState } from '../bot/whatsapp-auth-state.js';

describe('createWhatsAppAuthState', () => {
  it('persists creds and signal keys in the active store', async () => {
    const auth = await createWhatsAppAuthState();

    auth.state.creds.registered = true;
    auth.state.creds.advSecretKey = 'super-secret';
    await auth.saveCreds();
    await auth.state.keys.set({
      session: {
        'device-1': Buffer.from('session-data')
      }
    });

    const sameStore = await createWhatsAppAuthState();
    const sessions = await sameStore.state.keys.get('session', ['device-1']);

    assert.equal(sameStore.state.creds.registered, true);
    assert.equal(sameStore.state.creds.advSecretKey, 'super-secret');
    assert.deepEqual(sessions['device-1'], Buffer.from('session-data'));
  });

  it('clears persisted auth state', async () => {
    const auth = await createWhatsAppAuthState();
    auth.state.creds.registered = true;
    await auth.saveCreds();
    await auth.state.keys.set({
      session: {
        'device-2': Buffer.from('session-data')
      }
    });

    await auth.clear();

    const freshAuth = await createWhatsAppAuthState();
    const sessions = await freshAuth.state.keys.get('session', ['device-2']);

    assert.equal(freshAuth.state.creds.registered, false);
    assert.equal(sessions['device-2'], undefined);
  });
});
