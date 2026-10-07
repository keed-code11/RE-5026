import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import api from './api';
import ports from '../../../__ports.cjs';

const dist = relative(process.cwd(), fileURLToPath(new URL('../dist/', import.meta.url)));
const app = new Hono();
app.all('/api/*', (c) => api.fetch(c.req.raw));
app.use('*', serveStatic({ root: dist }));
app.get('*', serveStatic({ path: `${dist}/index.html` }));
serve({ fetch: app.fetch, port: ports.website }, (info) => {
  console.log(`RE Entertainment (Node.js): http://localhost:${info.port}`);
});
