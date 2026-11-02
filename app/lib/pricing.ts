// Bulk / pack pricing. One pure function prices a cart, so the cart page
// (browser), the shipping page, the Square checkout and the email-order
// summary all show and charge exactly the same discounts. The server always
// re-runs this itself — a price sent from the browser is never trusted.
//
// Discounts are mix-and-match: any flavors, 12 oz and 16 oz together.

import type { CartLine } from "../context/cart-context";
import { getProduct, getSize } from "../data/products";

// ---------------------------------------------------------------------------
// SETTINGS: edit these tiers to change the bulk deals.
// Each list is checked from the top; the first tier the count reaches wins.
// ---------------------------------------------------------------------------

/** 12 oz and 16 oz juice bottles (not gallons, not cleanses). */
export const BOTTLE_TIERS = [
  { minQty: 12, percentOff: 15, label: "12-pack" },
  { minQty: 6, percentOff: 10, label: "6-pack" },
];

/** 2 oz wellness shots. */
export const SHOT_TIERS = [
  { minQty: 10, percentOff: 20, label: "10-pack" },
  { minQty: 5, percentOff: 12, label: "5-pack" },
];

/** Gallons: 2 or more take this much off each gallon ($65 → $60). */
export const GALLON_MIN_QTY = 2;
export const GALLON_OFF_EACH_CENTS = 500;

// Cleanses are already bundle-priced in products.ts, so no extra discount.

// ---------------------------------------------------------------------------

export interface PricedLine {
  slug: string;
  sizeLabel: string;
  name: string;
  quantity: number;
  unitCents: number;
  lineCents: number;
}

export interface CartDiscount {
  /** Shown to the customer and on the Square receipt. */
  name: string;
  amountCents: number;
}

/** Nudge toward the next tier, e.g. "Add 2 more bottles to save 10%". */
export interface NextTierHint {
  message: string;
}

export interface PricedCart {
  lines: PricedLine[];
  subtotalCents: number;
  discounts: CartDiscount[];
  discountCents: number;
  totalCents: number;
  hints: NextTierHint[];
}

type Kind = "bottle" | "shot" | "gallon" | "other";

function kindOf(category: string, sizeLabel: string): Kind {
  if (category === "shot") return "shot";
  if (category === "juice" && sizeLabel === "Gallon") return "gallon";
  if (category === "juice") return "bottle";
  return "other";
}

function tierHint(
  count: number,
  tiers: { minQty: number; percentOff: number }[],
  noun: string,
): NextTierHint | null {
  // tiers are listed largest first; find the smallest tier not yet reached
  const next = [...tiers].reverse().find((t) => count < t.minQty);
  if (!next || count === 0) return null;
  const more = next.minQty - count;
  return {
    message: `Add ${more} more ${noun}${more === 1 ? "" : "s"} to save ${next.percentOff}%.`,
  };
}

export function priceCart(cart: CartLine[]): PricedCart {
  const lines: PricedLine[] = [];
  const sums: Record<Kind, { qty: number; cents: number }> = {
    bottle: { qty: 0, cents: 0 },
    shot: { qty: 0, cents: 0 },
    gallon: { qty: 0, cents: 0 },
    other: { qty: 0, cents: 0 },
  };

  for (const line of cart) {
    const product = getProduct(line.slug);
    const size = product && getSize(product, line.sizeLabel);
    const quantity = Math.floor(Number(line.quantity));
    if (!product || !size || !(quantity > 0)) continue;
    const lineCents = size.priceCents * quantity;
    lines.push({
      slug: product.slug,
      sizeLabel: size.label,
      name: product.name,
      quantity,
      unitCents: size.priceCents,
      lineCents,
    });
    const kind = kindOf(product.category, size.label);
    sums[kind].qty += quantity;
    sums[kind].cents += lineCents;
  }

  const subtotalCents = lines.reduce((t, l) => t + l.lineCents, 0);
  const discounts: CartDiscount[] = [];
  const hints: NextTierHint[] = [];

  const bottleTier = BOTTLE_TIERS.find((t) => sums.bottle.qty >= t.minQty);
  if (bottleTier) {
    discounts.push({
      name: `Juice ${bottleTier.label} — ${bottleTier.percentOff}% off ${sums.bottle.qty} bottles`,
      amountCents: Math.round((sums.bottle.cents * bottleTier.percentOff) / 100),
    });
  }
  const bottleHint = tierHint(sums.bottle.qty, BOTTLE_TIERS, "bottle");
  if (bottleHint) hints.push(bottleHint);

  const shotTier = SHOT_TIERS.find((t) => sums.shot.qty >= t.minQty);
  if (shotTier) {
    discounts.push({
      name: `Shot ${shotTier.label} — ${shotTier.percentOff}% off ${sums.shot.qty} shots`,
      amountCents: Math.round((sums.shot.cents * shotTier.percentOff) / 100),
    });
  }
  const shotHint = tierHint(sums.shot.qty, SHOT_TIERS, "shot");
  if (shotHint) hints.push(shotHint);

  if (sums.gallon.qty >= GALLON_MIN_QTY) {
    discounts.push({
      name: `${sums.gallon.qty} gallons — $${GALLON_OFF_EACH_CENTS / 100} off each`,
      amountCents: sums.gallon.qty * GALLON_OFF_EACH_CENTS,
    });
  } else if (sums.gallon.qty > 0) {
    hints.push({ message: `Add 1 more gallon and save $${GALLON_OFF_EACH_CENTS / 100} on each.` });
  }

  const discountCents = discounts.reduce((t, d) => t + d.amountCents, 0);
  return {
    lines,
    subtotalCents,
    discounts,
    discountCents,
    totalCents: subtotalCents - discountCents,
    hints,
  };
}
