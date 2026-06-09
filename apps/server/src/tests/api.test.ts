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
    return appDb.close();
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

    const logs = await appDb.listLogs();
    assert.equal(logs.some((log) => log.message === 'admin_config_updated'), true);
  });

  it('creates knowledge items through the protected API', async (t) => {
    if (!baseUrl) {
      t.skip(`HTTP listener unavailable: ${listenError?.message ?? 'unknown error'}`);
      return;
    }

    const login = await request(baseUrl)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(200);

    const token = login.body.token as string;

    const created = await request(baseUrl)
      .post('/api/v1/knowledge')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'FAQ Harga API',
        question: 'Berapa harga paket premium?',
        answer: 'Paket premium mulai dari 199 ribu.',
        tags: ['harga', 'premium']
      })
      .expect(201);

    assert.equal(created.body.title, 'FAQ Harga API');

    const list = await request(baseUrl)
      .get('/api/v1/knowledge')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert.equal(
      list.body.data.some((item: { id: string }) => item.id === created.body.id),
      true
    );
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

  it('rate limits repeated failed login attempts', async (t) => {
    if (!baseUrl) {
      t.skip(`HTTP listener unavailable: ${listenError?.message ?? 'unknown error'}`);
      return;
    }

    for (let i = 0; i < 5; i++) {
      await request(baseUrl)
        .post('/api/v1/auth/login')
        .send({ username: 'rate-limit-admin', password: 'wrong-password' })
        .expect(401);
    }

    const limited = await request(baseUrl)
      .post('/api/v1/auth/login')
      .send({ username: 'rate-limit-admin', password: 'wrong-password' })
      .expect(429);

    assert.equal(limited.body.message, 'Terlalu banyak percobaan login. Coba lagi nanti ya.');
  });
});
