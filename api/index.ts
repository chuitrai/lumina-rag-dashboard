import type { IncomingMessage, ServerResponse } from 'node:http';
import { app, ensureReady } from '../server/app.js';

// Vercel Node.js Functions invoke this default export with Node's raw
// req/res, which is exactly what an Express app instance expects — no
// app.listen() involved, Vercel's runtime owns the HTTP server.
export default async function handler(request: IncomingMessage, response: ServerResponse) {
  await ensureReady();
  app(request as any, response as any);
}
