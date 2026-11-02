import { useState } from "react";
import { data, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/subscribe";
import { formatPrice, products } from "../data/products";
import { cloudflareContext } from "../lib/cloudflare-context";
import { sendInquiryEmail } from "../lib/inquiry-email";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Subscribe & Save — UPHILL HARVEST" }];
}

// SETTINGS: subscription boxes and prices (per delivery). Retail is what the
// same bottles cost one at a time, used for the "save" figure.
export const SUBSCRIPTION_BOXES = [
  { id: "6x12", name: "6-pack · 12 oz", bottles: 6, priceCents: 3600, retailCents: 4200 },
  { id: "6x16", name: "6-pack · 16 oz", bottles: 6, priceCents: 4600, retailCents: 5400 },
  { id: "12x12", name: "12-pack · 12 oz", bottles: 12, priceCents: 6700, retailCents: 8400 },
  { id: "12x16", name: "12-pack · 16 oz", bottles: 12, priceCents: 8600, retailCents: 10800 },
];

export const SUBSCRIPTION_FREQUENCIES = ["Every week", "Every 2 weeks", "Every month"];

const SHOT_ADDON = { label: "Add a 5-pack of wellness shots", priceCents: 2000 };

const percentOff = (b: (typeof SUBSCRIPTION_BOXES)[number]) =>
  Math.round((1 - b.priceCents / b.retailCents) * 100);

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const get = (k: string) => String(form.get(k) ?? "").trim();

  const box = SUBSCRIPTION_BOXES.find((b) => b.id === get("box"));
  const frequency = SUBSCRIPTION_FREQUENCIES.find((f) => f === get("frequency"));
  const name = get("name");
  const email = get("email");
  if (!box || !frequency || !name || !email) {
    return data({ ok: false, error: "Please choose a box and frequency and fill in your name and email." }, { status: 400 });
  }
  const addShots = form.get("addShots") === "on";
  const perDelivery = box.priceCents + (addShots ? SHOT_ADDON.priceCents : 0);
  const delivery = get("delivery") === "ship" ? "Ship to me (shipping added per delivery)" : "Local pickup";
  const flavors = form.getAll("flavors").map(String).filter(Boolean);
  const address = [get("street"), get("city"), get("state"), get("zip")].filter(Boolean).join(", ");

  const { env } = context.get(cloudflareContext);
  try {
    await sendInquiryEmail(env, {
      kind: "Subscription request",
      customerName: name,
      customerEmail: email,
      fields: [
        ["Name", name],
        ["Email", email],
        ["Phone", get("phone")],
        ["Box", box.name],
        ["Wellness shots", addShots ? `${SHOT_ADDON.label} (+${formatPrice(SHOT_ADDON.priceCents)})` : ""],
        ["How often", frequency],
        ["Price per delivery", `${formatPrice(perDelivery)}${delivery.startsWith("Ship") ? " + shipping" : ""}`],
        ["Flavors", flavors.length ? flavors.join(", ") : "Mix of all four"],
        ["Delivery", delivery],
        ["Address", delivery.startsWith("Ship") ? address : ""],
        ["Start date", get("start")],
        ["Notes", get("notes")],
      ],
      confirmation: {
        subject: "Your UPHILL HARVEST subscription request",
        intro:
          "Thanks for subscribing! We've got your request and will reach out within one business day to confirm your first delivery date and set up payment. Nothing has been charged yet.",
      },
    });
  } catch (err) {
    console.error("Subscription request failed:", err);
    return data(
      { ok: false, error: "Sorry, we couldn't send your request. Please try again or email info@uphillnutrition.us." },
      { status: 500 },
    );
  }
  return data({ ok: true, error: null });
}

const inputClass = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2";

export default function Subscribe({ actionData }: Route.ComponentProps) {
  const [boxId, setBoxId] = useState(SUBSCRIPTION_BOXES[1].id);
  const [frequency, setFrequency] = useState(SUBSCRIPTION_FREQUENCIES[0]);
  const [addShots, setAddShots] = useState(false);
  const [delivery, setDelivery] = useState<"pickup" | "ship">("pickup");
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const juices = products.filter((p) => p.category === "juice");

  const box = SUBSCRIPTION_BOXES.find((b) => b.id === boxId)!;
  const perDelivery = box.priceCents + (addShots ? SHOT_ADDON.priceCents : 0);

  if (actionData?.ok) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold">You're on the list!</h1>
        <p className="mt-3 text-brand-grey">
          We got your subscription request and sent a copy to your email. We'll reach out within
          one business day to confirm your first delivery and set up payment. Nothing has been
          charged yet.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-block rounded-full bg-brand-teal px-6 py-3 font-medium text-white hover:bg-brand-teal-dark"
        >
          Back to the shop
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Subscribe &amp; Save</h1>
      <p className="mt-2 max-w-2xl text-brand-grey">
        Fresh cold-pressed juice on a schedule. Pick a box and how often you want it, and save up
        to 20% on every delivery. Skip, pause, or cancel any time. Just let us know before your
        next delivery.
      </p>

      <Form method="post" className="mt-10 space-y-10">
        <section>
          <h2 className="text-lg font-semibold">1. Choose your box</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SUBSCRIPTION_BOXES.map((b) => (
              <label
                key={b.id}
                className="cursor-pointer rounded-xl border border-black/10 bg-white p-4 transition has-[:checked]:border-brand-teal has-[:checked]:ring-2 has-[:checked]:ring-brand-teal/30"
              >
                <input
                  type="radio"
                  name="box"
                  value={b.id}
                  checked={boxId === b.id}
                  onChange={() => setBoxId(b.id)}
                  className="sr-only"
                />
                <p className="font-semibold">{b.name}</p>
                <p className="mt-2 text-2xl font-bold">{formatPrice(b.priceCents)}</p>
                <p className="text-xs text-brand-grey">
                  per delivery · <span className="line-through">{formatPrice(b.retailCents)}</span>
                </p>
                <p className="mt-2 inline-block rounded-full bg-brand-teal/10 px-2 py-0.5 text-xs font-semibold text-brand-teal">
                  Save {percentOff(b)}%
                </p>
              </label>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="addShots"
              checked={addShots}
              onChange={(e) => setAddShots(e.target.checked)}
            />
            {SHOT_ADDON.label} (+{formatPrice(SHOT_ADDON.priceCents)} per delivery)
          </label>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. How often?</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {SUBSCRIPTION_FREQUENCIES.map((f) => (
              <label
                key={f}
                className="cursor-pointer rounded-full border border-black/10 px-4 py-2 text-sm font-medium has-[:checked]:border-brand-teal has-[:checked]:bg-brand-teal has-[:checked]:text-white"
              >
                <input
                  type="radio"
                  name="frequency"
                  value={f}
                  checked={frequency === f}
                  onChange={() => setFrequency(f)}
                  className="sr-only"
                />
                {f}
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Flavors</h2>
          <p className="mt-1 text-sm text-brand-grey">
            Leave these unchecked for a mix of all four, or pick your favorites.
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            {juices.map((p) => (
              <label key={p.slug} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="flavors" value={p.name} />
                {p.name}
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Your details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input name="name" required autoComplete="name" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input name="email" type="email" required autoComplete="email" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone (optional)</label>
              <input name="phone" type="tel" autoComplete="tel" className={inputClass} />
            </div>
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-medium">Pickup or delivery?</legend>
            <div className="mt-2 flex gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="delivery"
                  value="pickup"
                  checked={delivery === "pickup"}
                  onChange={() => setDelivery("pickup")}
                />
                Local pickup (Brunswick)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="delivery"
                  value="ship"
                  checked={delivery === "ship"}
                  onChange={() => setDelivery("ship")}
                />
                Ship to me (overnight shipping added per delivery)
              </label>
            </div>
          </fieldset>

          {delivery === "ship" ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium">Street address</label>
                <input name="street" required autoComplete="street-address" className={inputClass} />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium">City</label>
                <input name="city" required className={inputClass} />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium">State</label>
                <input name="state" required maxLength={2} placeholder="GA" className={`${inputClass} uppercase`} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium">ZIP</label>
                <input name="zip" required inputMode="numeric" maxLength={5} className={inputClass} />
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">Preferred start date</label>
              <input name="start" type="date" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Notes (optional)</label>
              <input name="notes" placeholder="Allergies, delivery day, anything else" className={inputClass} />
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4 rounded-2xl bg-brand-teal/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-brand-grey">
              {box.name}
              {addShots ? " + shot 5-pack" : ""} · {frequency.toLowerCase()}
            </p>
            <p className="text-2xl font-bold">
              {formatPrice(perDelivery)}
              <span className="text-sm font-normal text-brand-grey">
                {" "}
                per delivery{delivery === "ship" ? " + shipping" : ""}
              </span>
            </p>
            <p className="text-xs text-brand-grey">
              No payment today. We'll confirm everything with you before your first delivery.
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-brand-teal px-8 py-3 font-semibold text-white transition hover:bg-brand-teal-dark disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Start my subscription"}
          </button>
        </div>
        {actionData && !actionData.ok ? (
          <p className="rounded-lg bg-brand-orange/10 px-4 py-3 text-sm text-brand-orange">
            {actionData.error}
          </p>
        ) : null}
      </Form>
    </main>
  );
}
