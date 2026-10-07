# RE Entertainment — Node.js and Vercel

The existing React + Vite + Hono + oRPC managed app is unchanged. Node.js compatibility is added alongside its original Bun entrypoint. No Next.js migration is needed.

## Run with Node.js

Install Node.js 24 LTS. From the extracted project root (the folder containing `vercel.json` and the root `package.json`):

```bash
npm ci
npm run dev:node
```

Open http://localhost:4200. No Bun installation is needed for these Node-specific commands.

For a local production build:

```bash
npm run build:node
npm run start:node
```

Stop the development server before starting production; both use the assigned website port (4200). Preserve `.runable/ports.json` when copying the project: it contains only port numbers, not credentials.

## Deploy to Vercel

1. Extract this ZIP and commit the **contents of the project folder** to a GitHub repository. Keep `api/`, `packages/`, `vercel.json`, `package-lock.json` and `.runable/ports.json` at the repository root.
2. In Vercel choose **Add New → Project**, then import that repository.
3. Set **Root Directory** to the repository root, **Framework Preset** to **Other**, and **Node.js Version** to **24.x**. Do not select `packages/web` as the root.
4. The included `vercel.json` supplies:
   - Install Command: `npm ci`
   - Build Command: `npm run build:node`
   - Output Directory: `packages/web/dist`
5. Deploy. No environment variables are needed for the current demo catalogue/cart/checkout.

The frontend is static, while `api/handler.ts` runs the Hono API as a Vercel Node.js function. API rewrites preserve RPC paths, static files are served first, and other URLs fall back to `index.html`, so refreshing `/clothes`, `/collection`, `/about`, and `/checkout` works.

### After deployment

- Open `/api/health` and expect `{"status":"ok"}`.
- Open `/clothes` and confirm 24 designs load.
- Select a product and size, add it to the bag, and complete a demo checkout.
- Refresh each page directly to verify SPA routing.

## What is and is not live

Prices are sample ZAR amounts. Inventory is five units per product with sample size allocations. The cart and demo order records use the browser's local storage. No actual payment, stock reservation, delivery, or order processing occurs. Add a real backend/payment provider before taking real orders.

## Verification and caveats

The Node build, production storefront, catalogue, stock/size/cart flow, checkout, and Vercel handler were tested locally. Live Vercel deployment requires your account and has not been performed. The full managed monorepo includes unused mobile/desktop scaffold dependencies; npm audit reports issues in that inherited tooling. A dependency security review is still recommended before enabling real commerce.

Secrets, installed dependencies, and generated build output are excluded from the ZIP. Do not upload private `.env` files to GitHub. The `.env.template` describes optional future integrations, not requirements for this demo.
