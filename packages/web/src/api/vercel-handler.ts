import app from './index';

// Vercel Node.js Web handler. The rewrite carries the original API path
// explicitly so RPC routing doesn't depend on Vercel's rewritten request URL.
export default {
  fetch(request: Request) {
    const url = new URL(request.url);
    const originalPath = url.searchParams.get('__re_path');
    if (originalPath !== null) {
      url.pathname = `/api/${originalPath}`;
      url.searchParams.delete('__re_path');
      request = new Request(url, request);
    }
    return app.fetch(request);
  },
};
