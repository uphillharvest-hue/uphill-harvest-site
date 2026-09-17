// SQUARE_ACCESS_TOKEN is a secret (set via `wrangler secret put SQUARE_ACCESS_TOKEN`,
// or a local .dev.vars entry for development) so it's not declared in wrangler.jsonc
// and therefore isn't picked up by `wrangler types`. Declare it here instead so the
// rest of the app gets type safety for it.
interface Env {
  SQUARE_ACCESS_TOKEN?: string;
}
