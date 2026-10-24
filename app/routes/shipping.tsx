import { useState } from "react";
import { data, Form, Link, redirect } from "react-router";
import type { Route } from "./+types/shipping";
import { formatPrice } from "../data/products";
import type { CartLine } from "../context/cart-context";
import { getShippingQuote, summarizeCartForShipping } from "../lib/shipping";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Shipping — UPHILL HARVEST" }];
}

// This page only has something to show after /cart posts the cart here.
// (Don't redirect from the loader: React Router re-runs it after the POST,
// and a redirect there would bounce every customer back to the cart.)
export async function loader() {
  return null;
}

type ActionResult =
  | { step: "unshippable"; cart: CartLine[] }
  | { step: "address"; cart: CartLine[]; hasUnshippableLines: boolean };

// Arrives here from /cart's "Continue to shipping" button with the cart.
export async function action({ request }: Route.ActionArgs) {
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

  if (!Array.isArray(cart) || cart.length === 0) {
    return redirect("/cart");
  }

  const { hasShippableLines, hasUnshippableLines } = summarizeCartForShipping(cart);
  if (!hasShippableLines) {
    return data<ActionResult>({ step: "unshippable", cart });
  }
  return data<ActionResult>({ step: "address", cart, hasUnshippableLines });
}

const inputClass = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2";

export default function Shipping({ actionData }: Route.ComponentProps) {
  if (!actionData) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Start from your cart</h1>
        <p className="mt-3 text-brand-grey">
          Head back to your cart and choose "Ship to me" to enter your address.
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

  return <AddressAndRates cart={actionData.cart} hasUnshippableLines={actionData.hasUnshippableLines} />;
}

function AddressAndRates({
  cart,
  hasUnshippableLines,
}: {
  cart: CartLine[];
  hasUnshippableLines: boolean;
}) {
  const [zip, setZip] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);

  const zipComplete = /^\d{5}$/.test(zip.trim());
  const quote = zipComplete ? getShippingQuote(zip, cart) : null;
  const options = quote?.options ?? [];
  const selectedId =
    options.find((o) => o.id === chosen)?.id ?? options[0]?.id ?? "";

  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold">Where's this headed?</h1>
      <p className="mt-2 text-sm text-brand-grey">
        Juice ships cold, overnight. Enter your address and your shipping cost shows up as soon
        as your ZIP code is in.
      </p>
      {hasUnshippableLines ? (
        <p className="mt-3 rounded-lg bg-brand-orange/10 px-4 py-3 text-sm text-brand-orange">
          Gallon sizes can't ship by mail and won't be included in this shipment. Remove them
          from your cart or choose local pickup for those.
        </p>
      ) : null}

      <Form method="post" action="/checkout" className="mt-6 space-y-4">
        <input type="hidden" name="cart" value={JSON.stringify(cart)} />
        <input type="hidden" name="fulfillmentType" value="SHIPMENT" />

        <div>
          <label className="block text-sm font-medium">Full name</label>
          <input name="recipientName" required autoComplete="name" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium">Street address</label>
          <input
            name="recipientStreet1"
            required
            autoComplete="address-line1"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Apt / suite (optional)</label>
          <input name="recipientStreet2" autoComplete="address-line2" className={inputClass} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium">City</label>
            <input
              name="recipientCity"
              required
              autoComplete="address-level2"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">State</label>
            <input
              name="recipientState"
              required
              maxLength={2}
              placeholder="GA"
              autoComplete="address-level1"
              className={`${inputClass} uppercase`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">ZIP</label>
            <input
              name="recipientZip"
              required
              inputMode="numeric"
              maxLength={5}
              pattern="\d{5}"
              autoComplete="postal-code"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Phone (for the carrier)</label>
          <input name="recipientPhone" type="tel" autoComplete="tel" className={inputClass} />
        </div>

        <fieldset className="pt-2">
          <legend className="text-sm font-medium">Shipping</legend>

          {!zipComplete ? (
            <p className="mt-2 rounded-lg border border-dashed border-black/15 px-4 py-3 text-sm text-brand-grey">
              Enter your ZIP code to see shipping options.
            </p>
          ) : !quote ? (
            <p className="mt-2 rounded-lg bg-brand-orange/10 px-4 py-3 text-sm text-brand-orange">
              Sorry, we can't ship fresh juice to that ZIP code. We ship to the lower 48 states
              only. Choose local pickup, or email us about your order.
            </p>
          ) : (
            <div className="mt-2 space-y-3">
              {options.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-black/10 px-4 py-3 has-[:checked]:border-brand-teal has-[:checked]:bg-brand-teal/5"
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingService"
                      value={option.id}
                      checked={selectedId === option.id}
                      onChange={() => setChosen(option.id)}
                      required
                    />
                    <span className="block font-medium">{option.label}</span>
                  </span>
                  <span className="font-semibold">{formatPrice(option.totalCents)}</span>
                </label>
              ))}
              <p className="text-xs text-brand-grey">
                Includes postage plus the insulated box and ice packs
                {quote.boxes > 1 ? ` (ships in ${quote.boxes} boxes)` : ""}.
              </p>
            </div>
          )}
        </fieldset>

        <button
          type="submit"
          disabled={!quote}
          className="w-full rounded-full bg-brand-orange px-6 py-3 text-center font-semibold text-white transition hover:bg-brand-orange-dark disabled:opacity-50"
        >
          Continue to payment
        </button>
      </Form>
    </main>
  );
}
