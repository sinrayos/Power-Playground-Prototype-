# Power Playground multiplayer server

Cloudflare Worker and Durable Object used for small real-time game rooms.

## Commands

- `npm run dev` starts a local Worker.
- `npm run check` validates and bundles without deploying.
- `npx wrangler login` authorizes the local Cloudflare CLI.
- `npm run deploy` deploys the Worker.

The browser connects to `/room/ROOMCODE` over WebSocket. Room codes contain 4-8 uppercase letters or numbers, and rooms hold up to eight players.
