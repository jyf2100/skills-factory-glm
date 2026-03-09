import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createServer } from './server.js';

describe('API Server', () => {
  let server: http.Server;
  let port: number;

  beforeEach(async () => {
    return new Promise<void>((resolve) => {
      server = createServer();
      server.listen(0, () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          port = address.port;
          resolve();
        }
      });
    });
  });

  afterEach(async () => {
    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  function makeRequest(path: string): Promise<{ status: number; body: string }> {
    return new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode || 0, body: data });
      });
    }).on('error', reject);
  });
  }

  it('should respond to GET /api/v1/health', async () => {
    const { status, body } = await makeRequest('/api/v1/health');
    assert.strictEqual(status, 200);
    const data = JSON.parse(body);
    assert.strictEqual(data.status, 'ok');
    assert.ok(data.timestamp);
    assert.strictEqual(data.version, '0.1.0');
  });

  it('should respond to GET /api/v1/skills', async () => {
    const { status, body } = await makeRequest('/api/v1/skills');
    assert.strictEqual(status, 200);
    const data = JSON.parse(body);
    assert.ok(Array.isArray(data.skills));
    assert.ok(data.total >= 0);
  });

  it('should return 404 for unknown routes', async () => {
    const { status } = await makeRequest('/api/v1/unknown');
    assert.strictEqual(status, 404);
  });

  it('should handle OPTIONS for CORS', async () => {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port,
        path: '/api/v1/health',
        method: 'OPTIONS',
      }, (res) => {
        assert.strictEqual(res.statusCode, 204);
        assert.strictEqual(res.headers['access-control-allow-origin'], '*');
        resolve();
      });
      req.on('error', reject);
      req.end();
    });
  });
});
