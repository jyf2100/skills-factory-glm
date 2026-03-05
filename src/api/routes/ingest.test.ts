import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createServer } from '../server.js';

describe('Ingest API', () => {
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

  it('should respond to POST /api/v1/ingest/import', async () => {
    const requestBody = JSON.stringify({
      source: 'github.com/owner/repo',
      skillId: 'test-skill',
    });

    const { status, body: responseBody } = await makeRequest(
      '/api/v1/ingest/import',
      'POST',
      requestBody
    );

    // Should return 202 Accepted for async operations
    assert.strictEqual(status, 202);
    const data = JSON.parse(responseBody);
    assert.strictEqual(data.status, 'pending');
    assert.ok(data.ingestId);
  });
});
