import { useState } from "react";
import { data, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/partners";
import { cloudflareContext } from "../lib/cloudflare-context";
import { sendInquiryEmail } from "../lib/inquiry-email";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Wholesale, Events & Private Label — UPHILL HARVEST" }];
}

// SETTINGS: private label minimum is 60 bottles a month.
const PRIVATE_LABEL_MIN_BOTTLES_PER_MONTH = 60;

const PARTNER_TYPES = [
  {
    id: "wholesale",
    title: "Wholesale",
    blurb:
      "Stock UPHILL HARVEST in your café, gym, market, salon or office. Recurring deliveries at wholesale pricing.",
    points: ["Wholesale pricing on 12 oz, 16 oz and shots", "Weekly or bi-weekly drops", "Shelf-ready bottles"],
  },
  {
    id: "events",
    title: "Events & corporate",
    blurb:
      "Weddings, retreats, team meetings, sports teams, church events. Fresh juice and shots for the whole group.",
    points: ["20% off orders of 24+ bottles", "Mix any flavors and sizes", "Local delivery or pickup"],
  },
  {
    id: "private-label",
    title: "Private label",
    blurb:
      "Your brand, our juice. We cold-press, bottle and label juice and wellness shots under your name.",
    points: [
      "Your logo and label design on our bottles",
      "Choose from our recipes or develop a custom blend",
      "2 oz shots, 12 oz and 16 oz bottles",
      `Minimum order: ${PRIVATE_LABEL_MIN_BOTTLES_PER_MONTH} bottles per month`,
      "Great for gyms, trainers, spas, hotels and wellness brands",
    ],
  },
];

const VOLUMES = ["24–47 bottles", "48–99 bottles", "100–249 bottles", "250+ bottles", "Not sure yet"];
const PRIVATE_LABEL_VOLUMES = [
  "60–99 bottles / month",
  "100–249 bottles / month",
  "250–499 bottles / month",
  "500+ bottles / month",
];
const FREQUENCIES = ["One time", "Weekly", "Every 2 weeks", "Monthly", "Not sure yet"];

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const type = PARTNER_TYPES.find((t) => t.id === get("type"));
  const name = get("name");
  const email = get("email");
  if (!type || !name || !email) {
    return data({ ok: false, error: "Please pick what you're interested in and fill in your name and email." }, { status: 400 });
  }

  if (type.id === "private-label" && !PRIVATE_LABEL_VOLUMES.includes(get("volume"))) {
    return data(
      {
        ok: false,
        error: `Private label orders start at ${PRIVATE_LABEL_MIN_BOTTLES_PER_MONTH} bottles per month. Please choose your monthly quantity.`,
      },
      { status: 400 },
    );
  }

  const { env } = context.get(cloudflareContext);
  try {
    await sendInquiryEmail(env, {
      kind: `${type.title} inquiry`,
      customerName: name,
      customerEmail: email,
      fields: [
        ["Interested in", type.title],
        ["Name", name],
        ["Company / organization", get("company")],
        ["Email", email],
        ["Phone", get("phone")],
        ["Estimated quantity", get("volume")],
        ["How often", get("frequency")],
        ["Date needed", get("date")],
        ["Details", get("message")],
      ],
      confirmation: {
        subject: `UPHILL HARVEST — your ${type.title.toLowerCase()} inquiry`,
        intro: `Thanks for reaching out about ${type.title.toLowerCase()}! We'll get back to you within one business day with pricing and next steps.`,
      },
    });
  } catch (err) {
    console.error("Partner inquiry failed:", err);
    return data(
      { ok: false, error: "Sorry, we couldn't send your inquiry. Please try again or email info@uphillnutrition.us." },
      { status: 500 },
    );
  }
  return data({ ok: true, error: null });
}

const inputClass = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2";

export default function Partners({ actionData }: Route.ComponentProps) {
  const [type, setType] = useState(PARTNER_TYPES[0].id);
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  if (actionData?.ok) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Thanks, we'll be in touch</h1>
        <p className="mt-3 text-brand-grey">
          We got your inquiry and sent a copy to your email. Expect to hear from us within one
          business day with pricing and next steps.
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
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Partner with UPHILL HARVEST</h1>
      <p className="mt-2 max-w-2xl text-brand-grey">
        Small-batch cold-pressed juice from Brunswick, Georgia, for your business, your event, or
        your own brand.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {PARTNER_TYPES.map((t) => (
          <div key={t.id} className="flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{t.title}</h2>
            <p className="mt-2 text-sm text-brand-grey">{t.blurb}</p>
            <ul className="mt-4 space-y-1 text-sm">
              {t.points.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="text-brand-teal">✓</span>
                  {p}
                </li>
              ))}
            </ul>
            <a
              href="#inquiry"
              onClick={() => setType(t.id)}
              className="mt-auto pt-5 text-sm font-semibold text-brand-teal hover:underline"
            >
              Get a quote →
            </a>
          </div>
        ))}
      </div>

      <section id="inquiry" className="mt-14 scroll-mt-24 rounded-2xl bg-brand-teal/5 p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Request a quote</h2>
        <p className="mt-1 text-sm text-brand-grey">
          Tell us a little about what you need and we'll reply within one business day.
        </p>

        <Form method="post" className="mt-6 space-y-4">
          {type === "private-label" ? (
            <p className="rounded-lg bg-white px-4 py-3 text-sm text-brand-grey">
              Private label orders start at{" "}
              <strong>{PRIVATE_LABEL_MIN_BOTTLES_PER_MONTH} bottles per month</strong>.
            </p>
          ) : null}
          <fieldset>
            <legend className="text-sm font-medium">I'm interested in</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {PARTNER_TYPES.map((t) => (
                <label
                  key={t.id}
                  className="cursor-pointer rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium has-[:checked]:border-brand-teal has-[:checked]:bg-brand-teal has-[:checked]:text-white"
                >
                  <input
                    type="radio"
                    name="type"
                    value={t.id}
                    checked={type === t.id}
                    onChange={() => setType(t.id)}
                    className="sr-only"
                  />
                  {t.title}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Your name</label>
              <input name="name" required autoComplete="name" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium">Company / organization</label>
              <input name="company" autoComplete="organization" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input name="email" type="email" required autoComplete="email" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone (optional)</label>
              <input name="phone" type="tel" autoComplete="tel" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium">Estimated quantity</label>
              <select
                key={type === "private-label" ? "pl" : "std"}
                name="volume"
                required={type === "private-label"}
                className={`${inputClass} bg-white`}
                defaultValue=""
              >
                <option value="" disabled>
                  Choose one
                </option>
                {(type === "private-label" ? PRIVATE_LABEL_VOLUMES : VOLUMES).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">How often</label>
              <select name="frequency" className={`${inputClass} bg-white`} defaultValue="">
                <option value="" disabled>
                  Choose one
                </option>
                {FREQUENCIES.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Date needed (optional)</label>
              <input name="date" type="date" className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Tell us more</label>
            <textarea
              name="message"
              rows={4}
              placeholder={
                type === "private-label"
                  ? "Your brand, which products you're thinking of, label ideas, timeline…"
                  : "Flavors, sizes, delivery location, anything else…"
              }
              className={inputClass}
            />
          </div>
          {actionData && !actionData.ok ? (
            <p className="rounded-lg bg-brand-orange/10 px-4 py-3 text-sm text-brand-orange">
              {actionData.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-brand-teal px-8 py-3 font-semibold text-white transition hover:bg-brand-teal-dark disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Send inquiry"}
          </button>
        </Form>
      </section>
    </main>
  );
}
