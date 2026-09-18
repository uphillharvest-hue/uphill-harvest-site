// Shipping-rate logic: quotes a real, carrier-calculated price for each
// order so UPHILL HARVEST never eats postage cost, then adds a flat
// handling fee on top to cover the insulated box + ice packs, which the
// carrier rate itself doesn't include.
//
// Uses EasyPost (https://easypost.com) as a multi-carrier rate aggregator
// so we get live USPS/UPS/FedEx rates from one API instead of integrating
// each carrier separately. Sign up is free and instant — no business
// verification needed to get a Test API Key. Claude cannot create this
// account for you (it involves registering an account, which is something
// only you should do), but once you have a key, drop it in:
//   - locally: add `EASYPOST_API_KEY=EZTK...` to .dev.vars
//   - production: `npx wrangler secret put EASYPOST_API_KEY`
// Until it's set, the shipping step shows a clear "not connected yet"
// message instead of a broken checkout (same pattern as the Square setup
// check in checkout.tsx).

import type { CartLine } from "../context/cart-context";
import { getProduct, getSize } from "../data/products";

// ---------------------------------------------------------------------------
// PLACEHOLDERS — everything in this block is a reasonable starting estimate,
// not a measured real-world value. Correct these once you've packed and
// weighed an actual shipment; they directly control how much you charge.
// ---------------------------------------------------------------------------

/** Where shipments originate — used to calculate real carrier rates. */
export const SHIP_FROM_ADDRESS = {
  company: "UPHILL HARVEST",
  street1: "REPLACE WITH YOUR STREET ADDRESS",
  city: "Brunswick",
  state: "GA",
  zip: "31520",
  country: "US",
};

/**
 * Weight of the box, insulation, and ice packs themselves (not the juice),
 * in ounces. A small insulated shipper + 1-2 ice packs is roughly 2 lb.
 */
export const PACKAGING_WEIGHT_OZ = 32;

/** Outer box dimensions in inches — a common small insulated-shipper size. */
export const BOX_DIMENSIONS_IN = { length: 9, width: 6, height: 6 };

/**
 * Flat fee added on top of the live carrier rate to cover the box,
 * insulation, ice packs, and packing time — none of which the carrier rate
 * itself accounts for. Without this, materials cost quietly eats margin on
 * every shipped order.
 */
export const HANDLING_FEE_CENTS = 800; // $8.00

/**
 * Rough ceiling on how many shippable units fit in one BOX_DIMENSIONS_IN
 * box alongside enough ice to stay cold. Above this, the single-box
 * assumption this code makes breaks down — treat larger orders as
 * "needs a manual look" rather than trusting the automated quote.
 */
export const MAX_UNITS_PER_BOX = 6;

// ---------------------------------------------------------------------------

export interface ShippingAddressInput {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
}

export interface ShippingRateOption {
  /** EasyPost rate id — round-trips through the form so checkout knows what was quoted. */
  id: string;
  carrier: string;
  service: string;
  /** Carrier's own price, in cents. */
  carrierCents: number;
  /** carrierCents + HANDLING_FEE_CENTS — this is what the customer is actually charged. */
  totalCents: number;
  deliveryDays: number | null;
  label: string;
}

export class ShippingNotConfiguredError extends Error {}
export class ShippingUnavailableError extends Error {}

interface CartWeightResult {
  totalOz: number;
  unitCount: number;
  hasUnshippableLines: boolean;
  hasShippableLines: boolean;
}

/** Sums packaged weight for the shippable lines in a cart; flags any Gallon-only lines. */
export function summarizeCartForShipping(lines: CartLine[]): CartWeightResult {
  let totalOz = PACKAGING_WEIGHT_OZ;
  let unitCount = 0;
  let hasUnshippableLines = false;
  let hasShippableLines = false;

  for (const line of lines) {
    const product = getProduct(line.slug);
    const size = product && getSize(product, line.sizeLabel);
    if (!product || !size || line.quantity <= 0) continue;

    if (!size.shippable) {
      hasUnshippableLines = true;
      continue;
    }
    hasShippableLines = true;
    unitCount += line.quantity;
    totalOz += (size.shipWeightOz ?? 16) * line.quantity;
  }

  return { totalOz, unitCount, hasUnshippableLines, hasShippableLines };
}

// Service-name substrings that count as "expedited enough for perishable
// juice". Matched case-insensitively against the EasyPost rate's `service`
// field. This is a safety list, not a cost-optimization list — ground and
// multi-day economy services are deliberately excluded so juice doesn't sit
// in a truck for four days.
const EXPEDITED_SERVICE_INCLUDES = [
  "PRIORITY",
  "EXPRESS",
  "OVERNIGHT",
  "2DAY",
  "2_DAY",
  "NEXTDAY",
  "NEXT_DAY",
  "FIRST",
];
const EXPEDITED_SERVICE_EXCLUDES = ["GROUND", "STANDARD", "ECONOMY", "SUREPOST", "SAVER"];

function isExpedited(service: string, deliveryDays: number | null): boolean {
  // Prefer the carrier's own delivery-days estimate when EasyPost provides
  // one — it's a more reliable signal than parsing service names.
  if (typeof deliveryDays === "number") return deliveryDays <= 2;

  const upper = service.toUpperCase();
  if (EXPEDITED_SERVICE_EXCLUDES.some((bad) => upper.includes(bad))) return false;
  return EXPEDITED_SERVICE_INCLUDES.some((good) => upper.includes(good));
}

interface EasyPostRate {
  id: string;
  carrier: string;
  service: string;
  rate: string; // dollars, as a string
  delivery_days: number | null;
}

/**
 * Quotes live, expedited-only shipping rates for a cart + destination
 * address via EasyPost, each with the handling fee already added in.
 * Throws ShippingNotConfiguredError if no API key is set, or
 * ShippingUnavailableError if EasyPost itself errors or returns nothing
 * expedited (e.g. an unreachable/invalid address).
 */
export async function getShippingRates(
  apiKey: string | undefined,
  to: ShippingAddressInput,
  lines: CartLine[],
): Promise<ShippingRateOption[]> {
  if (!apiKey) {
    throw new ShippingNotConfiguredError("EASYPOST_API_KEY is not set.");
  }

  const { totalOz, unitCount } = summarizeCartForShipping(lines);
  if (unitCount === 0) {
    throw new ShippingUnavailableError("Nothing shippable in this cart.");
  }

  const response = await fetch("https://api.easypost.com/v2/shipments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // EasyPost uses HTTP Basic auth with the API key as the username.
      Authorization: `Basic ${btoa(`${apiKey}:`)}`,
    },
    body: JSON.stringify({
      shipment: {
        to_address: {
          name: to.name,
          street1: to.street1,
          street2: to.street2 || undefined,
          city: to.city,
          state: to.state,
          zip: to.zip,
          phone: to.phone || undefined,
          country: "US",
        },
        from_address: SHIP_FROM_ADDRESS,
        parcel: {
          weight: totalOz,
          length: BOX_DIMENSIONS_IN.length,
          width: BOX_DIMENSIONS_IN.width,
          height: BOX_DIMENSIONS_IN.height,
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("EasyPost shipment creation failed:", body);
    throw new ShippingUnavailableError("Couldn't get shipping rates for that address.");
  }

  const result = (await response.json()) as { rates?: EasyPostRate[] };
  const rates = result.rates ?? [];

  const options = rates
    .filter((r) => isExpedited(r.service, r.delivery_days))
    .map((r): ShippingRateOption => {
      const carrierCents = Math.round(parseFloat(r.rate) * 100);
      const totalCents = carrierCents + HANDLING_FEE_CENTS;
      return {
        id: r.id,
        carrier: r.carrier,
        service: r.service,
        carrierCents,
        totalCents,
        deliveryDays: r.delivery_days,
        label: `${r.carrier} ${r.service}${
          r.delivery_days ? ` (~${r.delivery_days} day${r.delivery_days === 1 ? "" : "s"})` : ""
        }`,
      };
    })
    .sort((a, b) => a.totalCents - b.totalCents);

  if (options.length === 0) {
    throw new ShippingUnavailableError(
      "No expedited shipping options came back for that address.",
    );
  }

  return options;
}
