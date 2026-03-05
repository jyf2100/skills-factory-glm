/**
 * Skills Factory Market API Server
 *
 * A lightweight HTTP server providing skill marketplace APIs.
 */

import http from 'node:http';
import { URL } from 'node:url';
import { handleSkillsRoute } from './routes/skills.js';
import { handleHealthRoute } from './routes/health.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

import { handleIngestImport, handleIngestStatus, handleIngestList } from './routes/ingest.js';
import { handleReviewApprove, handleReviewReject, handleReviewStatus } from './routes/reviews.js';

interface Route {
  method: string;
  pattern: RegExp;
  handler: (req: http.IncomingMessage, res: http.ServerResponse, params: string[]) => Promise<void>;
}

const routes: Route[] = [
  { method: 'GET', pattern: /^\/api\/v1\/health$/, handler: handleHealthRoute },
  { method: 'GET', pattern: /^\/api\/v1\/skills$/, handler: handleSkillsRoute },
  { method: 'GET', pattern: /^\/api\/v1\/skills\/([^/]+)$/, handler: handleSkillsRoute },
  { method: 'POST', pattern: /^\/api\/v1\/ingest\/import$/, handler: handleIngestImport },
  { method: 'GET', pattern: /^\/api\/v1\/ingest\/([^/]+)$/, handler: handleIngestStatus },
  { method: 'GET', pattern: /^\/api\/v1\/ingest$/, handler: handleIngestList },
  { method: 'POST', pattern: /^\/api\/v1\/reviews\/([^/]+)\/approve$/, handler: handleReviewApprove },
  { method: 'POST', pattern: /^\/api\/v1\/reviews\/([^/]+)\/reject$/, handler: handleReviewReject },
  { method: 'GET', pattern: /^\/api\/v1\/reviews\/([^/]+)$/, handler: handleReviewStatus },
];

function parseUrl(req: http.IncomingMessage): { pathname: string; query: URLSearchParams } {
  const fullUrl = `http://localhost${req.url}`;
  const url = new URL(fullUrl);
  return {
    pathname: url.pathname,
    query: url.searchParams,
  };
}

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  const { pathname, query } = parseUrl(req);
  const method = req.method || 'GET';

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Find matching route
  for (const route of routes) {
    if (route.method !== method) continue;

    const match = pathname.match(route.pattern);
    if (match) {
      try {
        // Attach query params to request
        (req as any).query = query;
        (req as any).params = match.slice(1);
        await route.handler(req, res, match.slice(1));
        return;
      } catch (error) {
        console.error('Route handler error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
        return;
      }
    }
  }

  // No route matched
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

export function createServer(): http.Server {
  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch((error) => {
      console.error('Unhandled error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    });
  });

  return server;
}

export function startServer(port: number = PORT): http.Server {
  const server = createServer();

  server.listen(port, () => {
    console.log(`Skills Factory Market API running on http://localhost:${port}`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET /api/v1/health       Health check`);
    console.log(`  GET /api/v1/skills       List all skills`);
    console.log(`  GET /api/v1/skills/:id   Get skill details`);
  });

  return server;
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
