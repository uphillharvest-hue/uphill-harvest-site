import { Link } from "react-router";
import type { Route } from "./+types/shop";
import { products } from "../data/products";
import { ProductCard } from "../components/ProductCard";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Shop — UPHILL HARVEST" }];
}

// Shown on the shop page. Keep in step with the tiers in app/lib/pricing.ts.
const BULK_DEALS = [
  { title: "6-pack", detail: "Any 6 juices (12 or 16 oz)", save: "10% off", example: "6 × 12 oz: $42 → $37.80" },
  { title: "12-pack", detail: "Any 12 juices (12 or 16 oz)", save: "15% off", example: "12 × 16 oz: $108 → $91.80" },
  { title: "Shot 5-pack", detail: "Any 5 wellness shots", save: "12% off", example: "$25 → $22" },
  { title: "Shot 10-pack", detail: "Any 10 wellness shots", save: "20% off", example: "$50 → $40" },
  { title: "2+ gallons", detail: "Any flavors, local pickup", save: "$5 off each", example: "2 gallons: $130 → $120" },
];

export default function Shop() {
  const juices = products.filter((p) => p.category === "juice");
  const shots = products.filter((p) => p.category === "shot");
  const cleanses = products.filter((p) => p.category === "cleanse");

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Shop</h1>
      <p className="mt-2 max-w-xl text-brand-grey">
        Every bottle is pressed in small batches. Pick your favorites and add them to your cart.
      </p>

      <section id="bulk" className="mt-10 scroll-mt-24 rounded-2xl bg-brand-teal/5 p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Buy more, save more</h2>
            <p className="text-sm text-brand-grey">
              Mix and match any flavors. Savings are applied automatically in your cart.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {BULK_DEALS.map((deal) => (
            <div key={deal.title} className="rounded-xl border border-brand-teal/20 bg-white p-4">
              <p className="text-sm font-semibold">{deal.title}</p>
              <p className="mt-1 text-2xl font-bold text-brand-teal">{deal.save}</p>
              <p className="mt-1 text-xs text-brand-grey">{deal.detail}</p>
              <p className="mt-2 text-xs text-brand-grey/80">{deal.example}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            to="/subscribe"
            className="rounded-xl border border-black/10 bg-white p-4 transition hover:border-brand-teal"
          >
            <p className="font-semibold">Subscribe &amp; save up to 20% →</p>
            <p className="mt-1 text-sm text-brand-grey">
              A fresh 6- or 12-pack every week, every two weeks, or monthly.
            </p>
          </Link>
          <Link
            to="/partners"
            className="rounded-xl border border-black/10 bg-white p-4 transition hover:border-brand-teal"
          >
            <p className="font-semibold">Wholesale, events &amp; private label →</p>
            <p className="mt-1 text-sm text-brand-grey">
              Orders of 24+ bottles, stocking our juice, or juice under your own brand.
            </p>
          </Link>
        </div>
      </section>

      <section id="juices" className="mt-12 scroll-mt-24">
        <h2 className="mb-6 text-xl font-semibold">Juices — 12 oz, 16 oz &amp; Gallon</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {juices.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section id="cleanses" className="mt-16 scroll-mt-24">
        <h2 className="text-xl font-semibold">Juice Cleanses</h2>
        <p className="mb-6 mt-1 text-sm text-brand-grey">
          Six 16 oz juices per day across all four flavors. 1-, 3- and 5-day options.
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cleanses.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section id="shots" className="mt-16 scroll-mt-24">
        <h2 className="mb-6 text-xl font-semibold">Wellness Shots — 2 oz</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shots.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
