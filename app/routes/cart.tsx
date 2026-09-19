import { useState } from "react";
import { Form, Link } from "react-router";
import type { Route } from "./+types/cart";
import { getProduct, getSize, formatPrice } from "../data/products";
import { useCart } from "../context/cart-context";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Your Cart — UPHILL HARVEST" }];
}

export default function Cart() {
  const { lines, setQuantity, removeItem, totalCents } = useCart();
  const [pickupName, setPickupName] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");

  if (lines.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-brand-grey">Add a few bottles and they'll show up here.</p>
        <Link
          to="/shop"
          className="mt-6 inline-block rounded-full bg-brand-teal px-6 py-3 font-medium text-white hover:bg-brand-teal-dark"
        >
          Browse the shop
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Your Cart</h1>

      <ul className="mt-8 divide-y divide-black/5">
        {lines.map((line) => {
          const product = getProduct(line.slug);
          const size = product && getSize(product, line.sizeLabel);
          if (!product || !size) return null;
          return (
            <li key={`${line.slug}::${line.sizeLabel}`} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-brand-grey">
                  {formatPrice(size.priceCents)} · {line.sizeLabel}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  value={line.quantity}
                  onChange={(e) => setQuantity(line.slug, line.sizeLabel, Number(e.target.value))}
                  className="w-16 rounded-lg border border-black/10 px-2 py-1 text-center"
                />
                <button
                  type="button"
                  onClick={() => removeItem(line.slug, line.sizeLabel)}
                  className="text-sm text-brand-grey hover:text-brand-orange"
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex items-center justify-between border-t border-black/10 pt-6">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-lg font-semibold">{formatPrice(totalCents)}</span>
      </div>

      <div className="mt-8 border-t border-black/10 pt-6">
        <h2 className="text-lg font-semibold">How would you like to get your order?</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-black/10 p-4">
            <p className="font-medium">Pick up locally</p>
            <p className="mt-1 text-sm text-brand-grey">No shipping — grab it fresh, ready shortly after you order.</p>

            <Form method="post" action="/checkout" className="mt-4 space-y-3">
              <input type="hidden" name="cart" value={JSON.stringify(lines)} />
              <input type="hidden" name="fulfillmentType" value="PICKUP" />
              <div>
                <label htmlFor="pickupName" className="block text-sm font-medium">
                  Name for pickup
                </label>
                <input
                  id="pickupName"
                  name="pickupName"
                  required
                  value={pickupName}
                  onChange={(e) => setPickupName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="pickupPhone" className="block text-sm font-medium">
                  Phone number (optional)
                </label>
                <input
                  id="pickupPhone"
                  name="pickupPhone"
                  type="tel"
                  value={pickupPhone}
                  onChange={(e) => setPickupPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
                />
              </div>
              <button
                type="submit"
                disabled={lines.length === 0 || pickupName.trim() === ""}
                className="w-full rounded-full bg-brand-teal px-6 py-3 text-center font-semibold text-white transition hover:bg-brand-teal-dark disabled:opacity-50"
              >
                Continue — pick up locally
              </button>
            </Form>
          </div>

          <div className="rounded-xl border border-black/10 p-4">
            <p className="font-medium">Ship to me</p>
            <p className="mt-1 text-sm text-brand-grey">We'll quote a live, expedited shipping rate at checkout.</p>

            <Form method="post" action="/checkout/shipping" className="mt-4">
              <input type="hidden" name="cart" value={JSON.stringify(lines)} />
              <button
                type="submit"
                disabled={lines.length === 0}
                className="w-full rounded-full bg-brand-orange px-6 py-3 text-center font-semibold text-white transition hover:bg-brand-orange-dark disabled:opacity-50"
              >
                Continue to shipping
              </button>
            </Form>
          </div>
        </div>
      </div>
    </main>
  );
}
