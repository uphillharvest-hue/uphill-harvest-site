// Shipping-rate logic: estimates shipping from the customer's ZIP code
// using USPS-style distance zones measured from Brunswick, GA, plus the
// package weight. No carrier account or API key needed. The result is an
// ESTIMATE of what the label will cost, not a live carrier quote, so the
// rate tables below are deliberately padded a little. Adjust them any time
// your actual label costs drift from what customers are charged.
//
// This module is pure (no network calls), so the shipping page runs it in
// the browser to show rates the moment a ZIP is typed, and /checkout runs
// the exact same function on the server to decide what's actually charged.
// The browser's number is never trusted.

import type { CartLine } from "../context/cart-context";
import { getProduct, getSize } from "../data/products";

// ---------------------------------------------------------------------------
// SETTINGS: edit these to change what customers pay.
// ---------------------------------------------------------------------------

/**
 * Weight of one box + insulation + ice packs (not the juice), in ounces.
 * Estimate. Weigh a packed box and correct this.
 */
export const PACKAGING_WEIGHT_OZ = 32;

/** Flat fee per box for the insulated shipper, ice packs, and packing time. */
export const HANDLING_FEE_CENTS = 800; // $8.00

/** How many bottles fit in one insulated box with enough ice. */
export const MAX_UNITS_PER_BOX = 6;

/**
 * Estimated postage per box, in cents, by zone.
 *   base     = price for a box up to BASE_WEIGHT_LB
 *   perLb    = added for each pound over that
 * Zones are 1–8, like USPS: 1–2 is local (under ~150 miles), 8 is the West Coast.
 */
const BASE_WEIGHT_LB = 3;

export type ShippingServiceId = "OVERNIGHT";

interface ServiceConfig {
  id: ShippingServiceId;
  name: string;
  /** Delivery estimate shown to the customer. */
  transit: string;
  /** Highest zone this service is offered to. */
  maxZone: number;
  rates: Record<number, { base: number; perLb: number }>;
}

// Overnight only: juice is perishable, so every shipped order goes next
// business day (e.g. UPS Next Day Air / FedEx Standard Overnight / USPS
// Priority Mail Express where it's overnight). Rates are padded estimates of
// overnight label costs for a small insulated box.
export const SHIPPING_SERVICES: ServiceConfig[] = [
  {
    id: "OVERNIGHT",
    name: "Overnight",
    transit: "next business day",
    maxZone: 8,
    rates: {
      1: { base: 4500, perLb: 300 },
      2: { base: 4500, perLb: 300 },
      3: { base: 5200, perLb: 400 },
      4: { base: 6000, perLb: 500 },
      5: { base: 6800, perLb: 600 },
      6: { base: 7500, perLb: 700 },
      7: { base: 8200, perLb: 800 },
      8: { base: 9000, perLb: 900 },
    },
  },
];

// ---------------------------------------------------------------------------
// ZONE TABLE: first three digits of the destination ZIP → zone, measured from
// Brunswick, GA (ZIP 315). Ranges are inclusive. Approximates USPS zones by
// driving distance; edit any row if a region is consistently off.
// Anything not listed (Alaska, Hawaii, Puerto Rico, military/APO, territories)
// is not shippable, because perishable juice can't make those trips.
// ---------------------------------------------------------------------------

const ZONE_RANGES: [from: number, to: number, zone: number][] = [
  // New England
  [10, 27, 6], // MA
  [28, 29, 6], // RI
  [30, 38, 6], // NH
  [39, 49, 6], // ME
  [50, 59, 6], // VT
  [60, 69, 5], // CT
  // Mid-Atlantic
  [70, 89, 5], // NJ
  [100, 119, 5], // NYC, Long Island, lower NY
  [120, 129, 6], // Albany / northeastern NY
  [130, 149, 5], // central & western NY
  [150, 196, 5], // PA
  [197, 199, 5], // DE
  [200, 219, 5], // DC, MD
  [220, 232, 5], // northern & central VA, Richmond
  [233, 246, 4], // Hampton Roads, southern VA
  [247, 268, 5], // WV
  // Southeast
  [270, 289, 4], // NC
  [290, 295, 3], // SC (Columbia, Charleston, Florence)
  [296, 297, 4], // SC upstate (Greenville, Rock Hill)
  [298, 298, 3], // Aiken SC
  [299, 299, 2], // Beaufort / Hilton Head SC
  [300, 312, 3], // north & central GA (Atlanta, Athens, Augusta, Macon)
  [313, 316, 2], // Savannah, Brunswick, Waycross, Valdosta
  [317, 319, 3], // Albany & Columbus GA
  [320, 322, 2], // Jacksonville FL
  [323, 324, 3], // Tallahassee, Panama City
  [325, 325, 4], // Pensacola
  [326, 326, 2], // Gainesville
  [327, 329, 3], // Orlando, Daytona, Melbourne
  [330, 334, 4], // Miami, Fort Lauderdale, West Palm
  [335, 340, 3], // Tampa, St. Petersburg, Lakeland
  [341, 342, 4], // Fort Myers, Sarasota
  [344, 344, 3], // Ocala
  [346, 347, 3], // Tampa north, Orlando
  [349, 349, 4], // Fort Pierce
  [350, 362, 4], // AL (Birmingham, Montgomery)
  [363, 363, 3], // Dothan AL
  [364, 369, 4], // AL (Mobile, Selma)
  [370, 379, 4], // TN (Nashville, Chattanooga, Knoxville)
  [380, 385, 5], // west TN (Memphis)
  [386, 394, 5], // MS
  [395, 395, 4], // Gulfport / Biloxi MS
  [396, 397, 5], // MS
  [398, 399, 3], // GA (Albany area, IRS)
  // Midwest
  [400, 427, 5], // KY
  [430, 458, 5], // OH
  [460, 479, 5], // IN
  [480, 497, 5], // MI
  [498, 499, 6], // MI Upper Peninsula
  [500, 528, 6], // IA
  [530, 535, 5], // WI (Milwaukee, Madison)
  [537, 549, 6], // WI north
  [550, 567, 6], // MN
  [570, 577, 7], // SD
  [580, 588, 7], // ND
  [590, 599, 8], // MT
  [600, 629, 5], // IL
  [630, 639, 5], // MO (St. Louis)
  [640, 658, 6], // MO (Kansas City, Springfield)
  [660, 679, 6], // KS
  [680, 693, 6], // NE
  // South Central
  [700, 701, 4], // New Orleans
  [703, 714, 5], // rest of LA
  [716, 729, 5], // AR
  [730, 749, 6], // OK
  [750, 759, 5], // Dallas / east TX
  [760, 769, 6], // Fort Worth, west-central TX
  [770, 777, 5], // Houston
  [778, 789, 6], // Austin, San Antonio, south TX
  [790, 799, 7], // west TX, El Paso
  // Mountain & West
  [800, 816, 7], // CO
  [820, 831, 7], // WY
  [832, 838, 8], // ID
  [840, 847, 8], // UT
  [850, 865, 7], // AZ
  [870, 884, 7], // NM
  [885, 885, 7], // El Paso TX
  [889, 898, 8], // NV
  [900, 961, 8], // CA
  [970, 979, 8], // OR
  [980, 994, 8], // WA
];

/** Returns the zone (1–8) for a US ZIP, or null if we don't ship there. */
export function zoneForZip(zip: string): number | null {
  const match = /^\s*(\d{5})(?:-\d{4})?\s*$/.exec(zip);
  if (!match) return null;
  const prefix = Number(match[1].slice(0, 3));
  for (const [from, to, zone] of ZONE_RANGES) {
    if (prefix >= from && prefix <= to) return zone;
  }
  return null;
}

// ---------------------------------------------------------------------------

export interface ShippingRateOption {
  id: ShippingServiceId;
  /** e.g. "Priority (1–2 business days)", which also becomes the Square line label. */
  label: string;
  transit: string;
  /** Estimated postage across all boxes, in cents. */
  postageCents: number;
  /** Handling fee across all boxes, in cents. */
  handlingCents: number;
  /** What the customer is charged for shipping. */
  totalCents: number;
}

export interface ShippingQuote {
  zone: number;
  boxes: number;
  options: ShippingRateOption[];
}

interface CartWeightResult {
  juiceOz: number;
  unitCount: number;
  hasUnshippableLines: boolean;
  hasShippableLines: boolean;
}

/** Sums juice weight for the shippable lines in a cart; flags any Gallon-only lines. */
export function summarizeCartForShipping(lines: CartLine[]): CartWeightResult {
  let juiceOz = 0;
  let unitCount = 0;
  let hasUnshippableLines = false;
  let hasShippableLines = false;

  for (const line of lines) {
    const product = getProduct(line.slug);
    const size = product && getSize(product, line.sizeLabel);
    if (!product || !size || !(line.quantity > 0)) continue;

    if (!size.shippable) {
      hasUnshippableLines = true;
      continue;
    }
    hasShippableLines = true;
    unitCount += line.quantity;
    juiceOz += (size.shipWeightOz ?? 16) * line.quantity;
  }

  return { juiceOz, unitCount, hasUnshippableLines, hasShippableLines };
}

/**
 * Estimates shipping for a cart to a ZIP. Returns null when the ZIP isn't
 * valid / isn't somewhere we ship, or nothing in the cart can ship.
 */
export function getShippingQuote(zip: string, lines: CartLine[]): ShippingQuote | null {
  const zone = zoneForZip(zip);
  if (zone === null) return null;

  const { juiceOz, unitCount } = summarizeCartForShipping(lines);
  if (unitCount === 0) return null;

  const boxes = Math.ceil(unitCount / MAX_UNITS_PER_BOX);
  const ozPerBox = juiceOz / boxes + PACKAGING_WEIGHT_OZ;
  const lbPerBox = Math.ceil(ozPerBox / 16);
  const extraLb = Math.max(0, lbPerBox - BASE_WEIGHT_LB);

  const options = SHIPPING_SERVICES.filter((s) => zone <= s.maxZone && s.rates[zone])
    .map((s): ShippingRateOption => {
      const { base, perLb } = s.rates[zone];
      const postageCents = boxes * (base + extraLb * perLb);
      const handlingCents = boxes * HANDLING_FEE_CENTS;
      return {
        id: s.id,
        label: `${s.name} (${s.transit})`,
        transit: s.transit,
        postageCents,
        handlingCents,
        totalCents: postageCents + handlingCents,
      };
    })
    .sort((a, b) => a.totalCents - b.totalCents);

  if (options.length === 0) return null;
  return { zone, boxes, options };
}
