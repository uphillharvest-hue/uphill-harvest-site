// SQUARE_ACCESS_TOKEN and EASYPOST_API_KEY are secrets (set via
// `wrangler secret put <NAME>`, or a local .dev.vars entry for development)
// so they're not declared in wrangler.jsonc and therefore aren't picked up
// by `wrangler types`. Declare them here instead so the rest of the app
// gets type safety for them.
interface Env {
  SQUARE_ACCESS_TOKEN?: string;
  // From easypost.com — used to fetch live shipping rates. See the header
  // comment in app/lib/shipping.ts for setup steps.
  EASYPOST_API_KEY?: string;
}
