/**
 * Ingest API routes
 * Handles skill import workflow
 */

import http from 'node:http';

export interface ImportRequest {
  source: string;  // e.g., "github.com/owner/repo"
  skillId?: string;
}

export interface ImportResponse {
  status: 'pending' | 'completed' | 'failed';
  ingestId: string;
  skillId: string;
  message: string;
  auditResult?: {
    passed: boolean;
    issues: string[];
    riskLevel: string;
    hash: string;
  };
}

// Store for pending imports (in-memory, would be database in production)
const pendingImports = new Map<string, ImportResponse>();

/**
 * Handle POST /api/v1/ingest/import
 */
export async function handleIngestImport(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const request = JSON.parse(body) as ImportRequest;
        const { source, skillId } = request;

        if (!source) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Source is required' }));
          resolve();
          return;
        }

        // Generate ingest ID
        const ingestId = `ingest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

        // Default skill ID from source if not provided
        const resolvedSkillId =
          skillId ||
          source
            .split('/')
            .slice(-1)
            .join('-')
            .replace(/[^a-zA-Z0-]/g, '-');

        // Initial response
        const response: ImportResponse = {
          status: 'pending',
          ingestId,
          skillId: resolvedSkillId,
          message: 'Import started',
        };

        // Store pending import
        pendingImports.set(ingestId, response);

        // For now, simulate async processing
        // In production, this would trigger a background job
        setTimeout(() => {
          const pending = pendingImports.get(ingestId);
          if (pending) {
            pendingImports.set(ingestId, {
              ...pending,
              status: 'completed',
              message: 'Import completed (simulated)',
              auditResult: {
                passed: true,
                issues: [],
                riskLevel: 'low',
                hash: 'simulated-hash',
              },
            });
          }
        }, 100);

        res.writeHead(202, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        resolve();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: errorMessage }));
        resolve();
      }
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Handle GET /api/v1/ingest/:ingestId
 */
export async function handleIngestStatus(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  params: string[]
): Promise<void> {
  const ingestId = params[0];
  const pendingImport = pendingImports.get(ingestId);

  if (!pendingImport) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Import not found' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(pendingImport));
}

/**
 * Get all pending imports
 */
export async function handleIngestList(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  const imports = Array.from(pendingImports.values());
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ imports, total: imports.length }));
}
