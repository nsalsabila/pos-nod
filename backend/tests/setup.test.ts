import request from 'supertest';
import { createApp } from '../src/index';

describe('Server Initialization', () => {
  test('should create an Express application', () => {
    const app = createApp();
    expect(app).toBeDefined();
  });

  test('GET /health should return 200 with status ok', async () => {
    const app = createApp();
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('GET /nonexistent should return 404', async () => {
    const app = createApp();
    const response = await request(app).get('/nonexistent');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  test('GET /api/unknown should return 404', async () => {
    const app = createApp();
    const response = await request(app).get('/api/unknown');

    expect(response.status).toBe(404);
  });
});
