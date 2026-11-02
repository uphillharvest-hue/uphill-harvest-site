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
import gallonIslandGlow from "../assets/products/gallon-island-glow.png";
import gallonGreenGoddess from "../assets/products/gallon-green-goddess.png";
import gallonSunriseBlend from "../assets/products/gallon-sunrise-blend.png";
import gallonBeetBoost2 from "../assets/products/gallon-beet-boost-2.png";

export const productImages: Record<string, string> = {
  "island-glow": islandGlow,
  "green-goddess": greenGoddess,
  "sunrise-blend": sunriseBlend,
  "beet-boost-2": beetBoost2,
  "ginger-essence": gingerEssence,
  "golden-fire": goldenFire,
  "beet-charge": beetCharge,
};

// Gallon jug shots, one per flavor, colored to match each juice and labeled
// with its name. Used for the Gallon size instead of the bottle shot above.
export const gallonImages: Record<string, string> = {
  "island-glow": gallonIslandGlow,
  "green-goddess": gallonGreenGoddess,
  "sunrise-blend": gallonSunriseBlend,
  "beet-boost-2": gallonBeetBoost2,
};

// Fallback for any juice sold by the Gallon that has no jug shot of its own.
export const gallonImage = gallonAllFlavors;
