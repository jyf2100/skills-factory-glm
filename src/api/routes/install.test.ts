import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createServer } from '../server.js';

describe('Install API', () => {
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

  function makeRequest(
    path: string,
    method: string,
    body?: string
  ): Promise<{ status: number; body: string }> {
    return new Promise((resolve, reject) => {
      const options: http.RequestOptions = {
        hostname: 'localhost',
        port,
        path,
        method,
      };

      if (body) {
        options.headers = { 'Content-Type': 'application/json' };
      }

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk.toString();
        });
        res.on('end', () => {
          resolve({ status: res.statusCode || 0, body: data });
        });
      });

      req.on('error', (err) => reject(err));

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }

  it('should return 404 for non-existent skill', async () => {
    const { status } = await makeRequest(
      '/api/v1/install/non-existent/1.0.0',
      'GET'
    );

    assert.strictEqual(status, 404);
  });

  it('should return 404 when skill directory does not exist', async () => {
    const { status, body } = await makeRequest(
      '/api/v1/install/missing-skill/1.0.0',
      'GET'
    );

    assert.strictEqual(status, 404);
    const data = JSON.parse(body);
    assert.ok(data.error);
  });

  it('should handle route matching correctly', async () => {
    // This should return 404 because the route expects /api/v1/install/:skillId/:version
    const { status } = await makeRequest(
      '/api/v1/install/only-one-param',
      'GET'
    );

    assert.strictEqual(status, 404);
  });
});
