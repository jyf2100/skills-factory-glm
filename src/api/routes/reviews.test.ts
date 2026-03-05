import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createServer } from '../server.js';

describe('Reviews API', () => {
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

  it('should approve an import via POST /api/v1/reviews/:id/approve', async () => {
    // First create an import
    const importBody = JSON.stringify({
      source: 'github.com/test/repo',
      skillId: 'test-skill',
    });

    const importResult = await makeRequest(
      '/api/v1/ingest/import',
      'POST',
      importBody
    );

    const { ingestId } = JSON.parse(importResult.body);

    // Then approve it
    const approveBody = JSON.stringify({
      reviewer: 'admin',
      note: 'Looks good',
    });

    const { status, body: responseBody } = await makeRequest(
      `/api/v1/reviews/${ingestId}/approve`,
      'POST',
      approveBody
    );

    assert.strictEqual(status, 200);
    const data = JSON.parse(responseBody);
    assert.strictEqual(data.status, 'approved');
    assert.strictEqual(data.reviewer, 'admin');
  });

  it('should reject an import via POST /api/v1/reviews/:id/reject', async () => {
    // First create an import
    const importBody = JSON.stringify({
      source: 'github.com/test/repo2',
      skillId: 'test-skill-2',
    });

    const importResult = await makeRequest(
      '/api/v1/ingest/import',
      'POST',
      importBody
    );

    const { ingestId } = JSON.parse(importResult.body);

    // Then reject it
    const rejectBody = JSON.stringify({
      reviewer: 'admin',
      reason: 'Security concerns',
    });

    const { status, body: responseBody } = await makeRequest(
      `/api/v1/reviews/${ingestId}/reject`,
      'POST',
      rejectBody
    );

    assert.strictEqual(status, 200);
    const data = JSON.parse(responseBody);
    assert.strictEqual(data.status, 'rejected');
    assert.strictEqual(data.reviewer, 'admin');
  });

  it('should return 404 for non-existent import', async () => {
    const approveBody = JSON.stringify({
      reviewer: 'admin',
    });

    const { status } = await makeRequest(
      '/api/v1/reviews/non-existent-id/approve',
      'POST',
      approveBody
    );

    assert.strictEqual(status, 404);
  });
});
