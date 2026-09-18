// Real product photography, keyed by product slug (see app/data/products.ts).
// Add a new entry here once a photo exists for a product — components fall
// back to the placeholder <ProductArt> glyph for any slug not listed.

import islandGlow from "../assets/products/island-glow.png";
import greenGoddess from "../assets/products/green-goddess.png";
import sunriseBlend from "../assets/products/sunrise-blend.png";
import beetBoost2 from "../assets/products/beet-boost-2.png";
import gingerEssence from "../assets/products/ginger-essence.png";
import goldenFire from "../assets/products/golden-fire.png";
import beetCharge from "../assets/products/beet-charge.png";
import gallonAllFlavors from "../assets/products/gallon-all-flavors.png";

export const productImages: Record<string, string> = {
  "island-glow": islandGlow,
  "green-goddess": greenGoddess,
  "sunrise-blend": sunriseBlend,
  "beet-boost-2": beetBoost2,
  "ginger-essence": gingerEssence,
  "golden-fire": goldenFire,
  "beet-charge": beetCharge,
};

// Used for the Gallon size specifically (all four juices ship in the same
// jug), separate from the per-flavor bottle shot above.
export const gallonImage = gallonAllFlavors;
