import http from 'node:http';

export async function handleHealthRoute(
  _req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  }));
}
