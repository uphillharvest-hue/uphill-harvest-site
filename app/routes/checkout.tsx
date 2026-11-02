import { data, redirect } from "react-router";
import type { Route } from "./+types/checkout";
import { getProduct, getSize } from "../data/products";
import { cloudflareContext } from "../lib/cloudflare-context";
import { getShippingQuote } from "../lib/shipping";
import { priceCart } from "../lib/pricing";

interface CartLineInput {
  slug: string;
  sizeLabel: string;
  quantity: number;
}

// This route has no UI of its own — it's a server action that builds a
// Square-hosted checkout session and redirects the customer to it.
export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const raw = formData.get("cart");

  let lines: CartLineInput[] = [];
  try {
    lines = raw ? JSON.parse(String(raw)) : [];
  } catch {
    throw data("Could not read your cart. Please try again from the cart page.", {
      status: 400,
    });
  }

  if (!Array.isArray(lines)) lines = [];

  // Two fulfillment paths land here: a customer picking up locally posts
  // straight from /cart with fulfillmentType=PICKUP (no shipping needed at
  // all), while a customer shipping comes from /checkout/shipping with
  // fulfillmentType=SHIPMENT, their address, and the service they picked.
  const fulfillmentType = formData.get("fulfillmentType");
  const isPickup = fulfillmentType === "PICKUP";

  // Gallons can't ship — leave them out of shipped orders (the shipping
  // page tells the customer this before they get here). Pack discounts are
  // then priced on what's actually being bought.
  const includedLines = lines.filter((line) => {
    const product = getProduct(line.slug);
    const size = product && getSize(product, line.sizeLabel);
    return Boolean(size) && (isPickup || size!.shippable);
  });
  const priced = priceCart(includedLines);

  const lineItems = priced.lines.map((line) => ({
    name: `${line.name} (${line.sizeLabel})`,
    quantity: String(line.quantity),
    base_price_money: {
      amount: line.unitCents,
      currency: "USD",
    },
  }));

  // Bulk/pack savings go on the Square order as fixed-amount, order-level
  // discounts, so the receipt shows each one by name.
  const orderDiscounts = priced.discounts.map((d, i) => ({
    uid: `pack-discount-${i}`,
    name: d.name,
    type: "FIXED_AMOUNT",
    amount_money: { amount: d.amountCents, currency: "USD" },
    scope: "ORDER",
  }));

  if (lineItems.length === 0) {
    throw data("Your cart is empty.", { status: 400 });
  }

  let fulfillment: Record<string, unknown>;
  let shippingFee: { name: string; charge: { amount: number; currency: string } } | null = null;

  if (isPickup) {
    const pickupName = formData.get("pickupName");
    if (typeof pickupName !== "string" || pickupName.trim() === "") {
      throw data("Missing your name for pickup. Please start from your cart.", { status: 400 });
    }
    const pickupPhone = formData.get("pickupPhone");

    fulfillment = {
      type: "PICKUP",
      pickup_details: {
        recipient: {
          display_name: pickupName,
          phone_number:
            typeof pickupPhone === "string" && pickupPhone.trim() !== "" ? pickupPhone : undefined,
        },
        // ASAP tells Square to prep this right away; Square sets pickup_at
        // for us. (Local pickup hours/availability are configured in the
        // Square Dashboard's Order Manager / fulfillment settings.)
        schedule_type: "ASAP",
      },
    };
  } else {
    // Recalculate the shipping price here from the ZIP + cart + chosen
    // service. Never trust a price sent from the browser.
    const recipientZip = String(formData.get("recipientZip") ?? "").trim();
    const serviceId = formData.get("shippingService");
    const quote = getShippingQuote(recipientZip, lines);
    const chosen = quote?.options.find((o) => o.id === serviceId);
    if (!chosen) {
      throw data("Missing or invalid shipping selection. Please start from your cart.", {
        status: 400,
      });
    }
    shippingFee = {
      name: chosen.label,
      charge: { amount: chosen.totalCents, currency: "USD" },
    };

    const recipientStreet1 = formData.get("recipientStreet1");
    if (typeof recipientStreet1 !== "string" || recipientStreet1.trim() === "") {
      throw data("Missing shipping address. Please start from your cart.", { status: 400 });
    }
    const recipient = {
      display_name: String(formData.get("recipientName") ?? ""),
      address_line_1: recipientStreet1,
      address_line_2: String(formData.get("recipientStreet2") ?? "") || undefined,
      locality: String(formData.get("recipientCity") ?? ""),
      administrative_district_level_1: String(formData.get("recipientState") ?? ""),
      postal_code: recipientZip,
      country: "US",
      phone_number: String(formData.get("recipientPhone") ?? "") || undefined,
    };

    fulfillment = {
      type: "SHIPMENT",
      shipment_details: { recipient },
    };
  }

  const { env } = context.get(cloudflareContext);
  const accessToken = env.SQUARE_ACCESS_TOKEN;
  const locationId = env.SQUARE_LOCATION_ID;

  // Square isn't connected yet — send the customer somewhere honest instead
  // of a broken checkout, and let the site owner know what's missing.
  if (!accessToken || !locationId || locationId === "REPLACE_WITH_SQUARE_LOCATION_ID") {
    return redirect("/checkout/setup-needed");
  }

  const apiBase =
    (env.SQUARE_ENVIRONMENT as string) === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

  const origin = new URL(request.url).origin;

  const squareResponse = await fetch(`${apiBase}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Check developer.squareup.com for the current API version before launch.
      "Square-Version": "2025-09-17",
    },
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      order: {
        location_id: locationId,
        line_items: lineItems,
        ...(orderDiscounts.length > 0 ? { discounts: orderDiscounts } : {}),
        fulfillments: [fulfillment],
      },
      checkout_options: {
        redirect_url: `${origin}/checkout/success`,
        // We already collected the address (or skipped it, for pickup) on
        // our own pages, so don't make Square ask for it again.
        ask_for_shipping_address: false,
        // Show Apple Pay (and Google Pay) as one-tap options on Square's
        // hosted checkout page, alongside the regular card form. These only
        // ever appear when the buyer's own browser/device supports them
        // (e.g. Apple Pay needs Safari on an Apple device) — this setting
        // just allows Square to offer them when it can.
        accepted_payment_methods: {
          apple_pay: true,
          google_pay: true,
          // Buy-now-pay-later: splits the order into 4 interest-free
          // payments for the customer. Square pays us the full amount
          // upfront. Works for orders roughly $1–$2,000, so any juice
          // order qualifies — also needs Afterpay turned on under
          // Square Dashboard > Settings > Payments > Payment methods.
          afterpay_clearpay: true,
          // Also needs Cash App Pay turned on under Square Dashboard >
          // Payments & orders > Payment links > Settings > General.
          cash_app_pay: true,
        },
        ...(shippingFee ? { shipping_fee: shippingFee } : {}),
      },
    }),
  });

  if (!squareResponse.ok) {
    const errorBody = await squareResponse.text();
    console.error("Square payment link creation failed:", errorBody);
    return redirect("/checkout/error");
  }

  const result = (await squareResponse.json()) as {
    payment_link?: { url?: string };
  };

  const checkoutUrl = result.payment_link?.url;
  if (!checkoutUrl) {
    return redirect("/checkout/error");
  }

  return redirect(checkoutUrl);
}
