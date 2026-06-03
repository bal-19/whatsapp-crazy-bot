import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import request from 'supertest';
import { createApp } from '../api/app.js';
import { appDb } from '../db/database.js';

const app = createApp();
let server: http.Server | null = null;
let baseUrl = '';
let listenError: Error | null = null;

describe('api', () => {
  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server?.address();
        if (typeof address === 'object' && address) {
          baseUrl = `http://127.0.0.1:${address.port}`;
          resolve();
          return;
        }
        listenError = new Error('Unable to determine test server port');
        resolve();
      });
      server.once('error', (error) => {
        listenError = error;
        resolve();
      });
    });
  });

  after(() => {
    server?.close();
    appDb.close();
  });

  it('requires JWT for protected endpoints', async (t) => {
    if (!baseUrl) {
      t.skip(`HTTP listener unavailable: ${listenError?.message ?? 'unknown error'}`);
      return;
    }
    await request(baseUrl).get('/api/v1/config').expect(401);
  });

  it('logs in and persists config updates', async (t) => {
    if (!baseUrl) {
      t.skip(`HTTP listener unavailable: ${listenError?.message ?? 'unknown error'}`);
      return;
    }
    const login = await request(baseUrl)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(200);

    const token = login.body.token as string;
    assert.ok(token);

    await request(baseUrl)
      .put('/api/v1/config')
      .set('Authorization', `Bearer ${token}`)
      .send({ bot_name: 'Tester Bot' })
      .expect(200);

    const config = await request(baseUrl).get('/api/v1/config').set('Authorization', `Bearer ${token}`).expect(200);
    assert.equal(config.body.bot_name, 'Tester Bot');
  });

  it('returns conversations and logs collections', async (t) => {
    if (!baseUrl) {
      t.skip(`HTTP listener unavailable: ${listenError?.message ?? 'unknown error'}`);
      return;
    }
    const login = await request(baseUrl).post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
    const token = login.body.token as string;

    await request(baseUrl).get('/api/v1/conversations').set('Authorization', `Bearer ${token}`).expect(200);
    await request(baseUrl).get('/api/v1/logs').set('Authorization', `Bearer ${token}`).expect(200);
  });
});
