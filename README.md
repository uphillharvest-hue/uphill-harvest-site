# UPHILL HARVEST

Cold-pressed juice storefront for UPHILL HARVEST (Brunswick, Georgia) — built with
React Router (Framework Mode) and deployed on Cloudflare Workers.

## What's here

- `app/data/products.ts` — the confirmed product catalog: 4 juices (12 oz / 16 oz /
  Gallon pricing) and 3 wellness shots (2 oz).
- `app/routes/` — pages: home, shop, product detail, cart, and the checkout flow.
- `app/context/cart-context.tsx` — client-side cart (persisted to the browser's
  local storage, no account needed to shop).
- `app/routes/checkout.tsx` — creates a Square-hosted checkout session for
  whatever's in the cart and redirects the customer to it.

## Local development

```sh
npm install
npm run dev
```

Visit http://localhost:5173.

## Connecting Square (required for real checkout)

Until Square is configured, clicking "Checkout with Square" sends customers to a
friendly "checkout isn't connected yet" page instead of a broken payment form.

1. Create a Square account and app at https://developer.squareup.com/apps.
2. Grab a **Location ID** (Square Dashboard → your location's settings) and an
   **Access Token** (start with the **Sandbox** token while testing).
3. For local dev: copy `.dev.vars.example` to `.dev.vars` and fill in
   `SQUARE_ACCESS_TOKEN` (this file is gitignored — never commit it).
4. Set `SQUARE_LOCATION_ID` in `wrangler.jsonc` (this one is *not* secret, safe to
   commit).
5. For production, set the real access token as a Cloudflare secret (never in a
   file that gets committed):
   ```sh
   npx wrangler secret put SQUARE_ACCESS_TOKEN
   ```
6. Flip `SQUARE_ENVIRONMENT` in `wrangler.jsonc` from `"sandbox"` to `"production"`
   once you're using a production access token.

## Deploying

```sh
npm run deploy
```

Or connect this repo to Cloudflare Workers Builds (Workers & Pages → your project
→ Settings → Builds → Connect to Git) for automatic deploys on every push to
`main`.

## Product catalog

**Juices** (Island Glow, Green Goddess, Sunrise Blend, Beet Boost 2): 12 oz $7,
16 oz $9, Gallon $65.

**Wellness Shots**, 2 oz, $5 each: Ginger Essence, Golden Fire, Beet Charge.
