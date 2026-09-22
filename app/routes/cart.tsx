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

  // "Email us your order" — a temporary stand-in for online checkout while
  // Square payment is down. Collects the same info as the two payment paths
  // above, but posts to /order-by-email instead of charging a card.
  const [emailName, setEmailName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [emailPhone, setEmailPhone] = useState("");
  const [emailNotes, setEmailNotes] = useState("");
  const [emailFulfillment, setEmailFulfillment] = useState<"PICKUP" | "SHIPMENT">("PICKUP");
  const [emailStreet1, setEmailStreet1] = useState("");
  const [emailStreet2, setEmailStreet2] = useState("");
  const [emailCity, setEmailCity] = useState("");
  const [emailState, setEmailState] = useState("");
  const [emailZip, setEmailZip] = useState("");

  const emailFormValid =
    lines.length > 0 &&
    emailName.trim() !== "" &&
    emailAddress.trim() !== "" &&
    (emailFulfillment === "PICKUP" ||
      (emailStreet1.trim() !== "" &&
        emailCity.trim() !== "" &&
        emailState.trim() !== "" &&
        emailZip.trim() !== ""));

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

      <div className="mt-8 border-t border-black/10 pt-6">
        <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4">
          <p className="font-medium">Special or bulk order? Have a question?</p>
          <p className="mt-1 text-sm text-brand-grey">
            For custom requests, larger bulk orders, or anything you'd like to ask before buying,
            email us your details below and we'll follow up personally.
          </p>

          <Form method="post" action="/order-by-email" className="mt-4 space-y-4">
            <input type="hidden" name="cart" value={JSON.stringify(lines)} />
            <input type="hidden" name="fulfillmentType" value={emailFulfillment} />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="emailName" className="block text-sm font-medium">
                  Name
                </label>
                <input
                  id="emailName"
                  name="customerName"
                  required
                  value={emailName}
                  onChange={(e) => setEmailName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="emailAddress" className="block text-sm font-medium">
                  Email
                </label>
                <input
                  id="emailAddress"
                  name="customerEmail"
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label htmlFor="emailPhone" className="block text-sm font-medium">
                Phone (optional)
              </label>
              <input
                id="emailPhone"
                name="customerPhone"
                type="tel"
                value={emailPhone}
                onChange={(e) => setEmailPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
              />
            </div>

            <fieldset>
              <legend className="block text-sm font-medium">How should we get it to you?</legend>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={emailFulfillment === "PICKUP"}
                    onChange={() => setEmailFulfillment("PICKUP")}
                  />
                  Pick up locally
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={emailFulfillment === "SHIPMENT"}
                    onChange={() => setEmailFulfillment("SHIPMENT")}
                  />
                  Ship to me
                </label>
              </div>
            </fieldset>

            {emailFulfillment === "SHIPMENT" ? (
              <div className="space-y-3 rounded-lg bg-white/60 p-3">
                <div>
                  <label className="block text-sm font-medium">Street address</label>
                  <input
                    name="street1"
                    required
                    value={emailStreet1}
                    onChange={(e) => setEmailStreet1(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Apt / suite (optional)</label>
                  <input
                    name="street2"
                    value={emailStreet2}
                    onChange={(e) => setEmailStreet2(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium">City</label>
                    <input
                      name="city"
                      required
                      value={emailCity}
                      onChange={(e) => setEmailCity(e.target.value)}
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
                      value={emailState}
                      onChange={(e) => setEmailState(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">ZIP</label>
                    <input
                      name="zip"
                      required
                      value={emailZip}
                      onChange={(e) => setEmailZip(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div>
              <label htmlFor="emailNotes" className="block text-sm font-medium">
                Notes (optional)
              </label>
              <textarea
                id="emailNotes"
                name="notes"
                rows={2}
                value={emailNotes}
                onChange={(e) => setEmailNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={!emailFormValid}
              className="w-full rounded-full border-2 border-brand-orange px-6 py-3 text-center font-semibold text-brand-orange transition hover:bg-brand-orange hover:text-white disabled:opacity-50"
            >
              Email us this order
            </button>
          </Form>
        </div>
      </div>
    </main>
  );
}
