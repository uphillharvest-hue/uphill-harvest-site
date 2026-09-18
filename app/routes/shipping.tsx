import { data, Form, Link, redirect } from "react-router";
import type { Route } from "./+types/shipping";
import { formatPrice } from "../data/products";
import type { CartLine } from "../context/cart-context";
import { cloudflareContext } from "../lib/cloudflare-context";
import {
  getShippingRates,
  summarizeCartForShipping,
  ShippingNotConfiguredError,
  ShippingUnavailableError,
  MAX_UNITS_PER_BOX,
  type ShippingRateOption,
} from "../lib/shipping";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Shipping — UPHILL HARVEST" }];
}

// No cart data means there's nothing to quote — send them back to build one.
export async function loader() {
  return redirect("/cart");
}

type ActionResult =
  | { step: "not-configured"; cart: CartLine[] }
  | { step: "unshippable"; cart: CartLine[] }
  | { step: "address"; cart: CartLine[]; overCapacity: boolean }
  | { step: "rates"; cart: CartLine[]; rates: ShippingRateOption[]; recipient: RecipientFields }
  | { step: "error"; cart: CartLine[]; message: string };

interface RecipientFields {
  name: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const raw = formData.get("cart");

  let cart: CartLine[] = [];
  try {
    cart = raw ? JSON.parse(String(raw)) : [];
  } catch {
    throw data("Could not read your cart. Please try again from the cart page.", {
      status: 400,
    });
  }

  if (cart.length === 0) {
    return redirect("/cart");
  }

  const { totalOz, unitCount, hasShippableLines } = summarizeCartForShipping(cart);

  if (!hasShippableLines) {
    return data<ActionResult>({ step: "unshippable", cart });
  }

  const street1 = formData.get("street1");

  // First pass through this route for this cart: show the address form.
  if (typeof street1 !== "string" || street1.trim() === "") {
    const { env } = context.get(cloudflareContext);
    if (!env.EASYPOST_API_KEY) {
      return data<ActionResult>({ step: "not-configured", cart });
    }
    return data<ActionResult>({
      step: "address",
      cart,
      overCapacity: unitCount > MAX_UNITS_PER_BOX,
    });
  }

  // Second pass: address was submitted — quote real rates.
  const recipient: RecipientFields = {
    name: String(formData.get("name") ?? ""),
    street1: street1.trim(),
    street2: String(formData.get("street2") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    state: String(formData.get("state") ?? "")
      .trim()
      .toUpperCase(),
    zip: String(formData.get("zip") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
  };

  const { env } = context.get(cloudflareContext);

  try {
    const rates = await getShippingRates(env.EASYPOST_API_KEY, recipient, cart);
    return data<ActionResult>({ step: "rates", cart, rates, recipient });
  } catch (err) {
    if (err instanceof ShippingNotConfiguredError) {
      return data<ActionResult>({ step: "not-configured", cart });
    }
    if (err instanceof ShippingUnavailableError) {
      return data<ActionResult>({ step: "error", cart, message: err.message });
    }
    console.error("Unexpected shipping error:", err);
    return data<ActionResult>({
      step: "error",
      cart,
      message: "Something went wrong getting shipping rates. Please try again.",
    });
  }
}

export default function Shipping({ actionData }: Route.ComponentProps) {
  if (!actionData) {
    return null; // loader always redirects away before this renders
  }

  const cartField = <input type="hidden" name="cart" value={JSON.stringify(actionData.cart)} />;

  if (actionData.step === "unshippable") {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Gallons ship locally, not by mail</h1>
        <p className="mt-3 text-brand-grey">
          A full gallon is too heavy and fragile to ship reliably with ice packs. For gallon
          orders, please reach out directly to arrange local pickup or delivery.
        </p>
        <Link
          to="/cart"
          className="mt-6 inline-block rounded-full bg-brand-teal px-6 py-3 font-medium text-white hover:bg-brand-teal-dark"
        >
          Back to cart
        </Link>
      </main>
    );
  }

  if (actionData.step === "not-configured") {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Shipping isn't connected yet</h1>
        <p className="mt-3 text-brand-grey">
          This store's shipping-rate provider hasn't been set up on the backend yet, so online
          checkout for shipped orders is temporarily unavailable. Your cart is safe — try again
          soon.
        </p>
        <Link
          to="/cart"
          className="mt-6 inline-block rounded-full bg-brand-teal px-6 py-3 font-medium text-white hover:bg-brand-teal-dark"
        >
          Back to cart
        </Link>
      </main>
    );
  }

  if (actionData.step === "error") {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Couldn't get a shipping rate</h1>
        <p className="mt-3 text-brand-grey">{actionData.message}</p>
        <Link
          to="/cart"
          className="mt-6 inline-block rounded-full bg-brand-teal px-6 py-3 font-medium text-white hover:bg-brand-teal-dark"
        >
          Back to cart
        </Link>
      </main>
    );
  }

  if (actionData.step === "address") {
    return (
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold">Where's this headed?</h1>
        <p className="mt-2 text-sm text-brand-grey">
          Juice ships cold and fast — we'll show real Priority/2-Day/Overnight rates for your
          address next, no ground shipping.
        </p>
        {actionData.overCapacity ? (
          <p className="mt-3 rounded-lg bg-brand-orange/10 px-4 py-3 text-sm text-brand-orange">
            This is a larger order than we've automated rates for yet — the quote you get next
            may not be accurate. We'll follow up before charging your card if anything looks off.
          </p>
        ) : null}

        <Form method="post" className="mt-6 space-y-4">
          {cartField}
          <div>
            <label className="block text-sm font-medium">Full name</label>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Street address</label>
            <input
              name="street1"
              required
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Apt / suite (optional)</label>
            <input
              name="street2"
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-sm font-medium">City</label>
              <input
                name="city"
                required
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">State</label>
              <input
                name="state"
                required
                maxLength={2}
                placeholder="GA"
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">ZIP</label>
              <input
                name="zip"
                required
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Phone (for the carrier)</label>
            <input
              name="phone"
              type="tel"
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-brand-orange px-6 py-3 text-center font-semibold text-white transition hover:bg-brand-orange-dark"
          >
            See shipping rates
          </button>
        </Form>
      </main>
    );
  }

  // step === "rates"
  const { rates, recipient } = actionData;
  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold">Choose a shipping speed</h1>
      <p className="mt-2 text-sm text-brand-grey">
        Live rates for {recipient.city}, {recipient.state} {recipient.zip}, plus a flat packaging
        fee for the insulated box and ice packs.
      </p>

      <Form method="post" action="/checkout" className="mt-6 space-y-3">
        {cartField}
        <input type="hidden" name="recipientName" value={recipient.name} />
        <input type="hidden" name="recipientStreet1" value={recipient.street1} />
        <input type="hidden" name="recipientStreet2" value={recipient.street2} />
        <input type="hidden" name="recipientCity" value={recipient.city} />
        <input type="hidden" name="recipientState" value={recipient.state} />
        <input type="hidden" name="recipientZip" value={recipient.zip} />
        <input type="hidden" name="recipientPhone" value={recipient.phone} />

        {rates.map((rate, index) => (
          <label
            key={rate.id}
            className="flex cursor-pointer items-center justify-between rounded-lg border border-black/10 px-4 py-3 has-[:checked]:border-brand-teal has-[:checked]:bg-brand-teal/5"
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="selectedRateIndex"
                value={index}
                defaultChecked={index === 0}
                required
              />
              <span>
                <span className="block font-medium">{rate.label}</span>
                <span className="block text-xs text-brand-grey">
                  {formatPrice(rate.carrierCents)} carrier rate + packaging fee
                </span>
              </span>
            </span>
            <span className="font-semibold">{formatPrice(rate.totalCents)}</span>
          </label>
        ))}

        <input
          type="hidden"
          name="rateOptions"
          value={JSON.stringify(rates.map((r) => ({ label: r.label, totalCents: r.totalCents })))}
        />

        <button
          type="submit"
          className="mt-4 w-full rounded-full bg-brand-orange px-6 py-3 text-center font-semibold text-white transition hover:bg-brand-orange-dark"
        >
          Continue to payment
        </button>
      </Form>
    </main>
  );
}
