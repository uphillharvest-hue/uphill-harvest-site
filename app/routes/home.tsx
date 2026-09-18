import { Link } from "react-router";
import type { Route } from "./+types/home";
import { products } from "../data/products";
import { ProductCard } from "../components/ProductCard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "UPHILL HARVEST — Small-Batch Cold-Pressed Juice" },
    {
      name: "description",
      content:
        "Small-batch cold-pressed juices and wellness shots, made fresh in Brunswick, Georgia.",
    },
  ];
}

export default function Home() {
  const featured = products.filter((p) => p.category === "juice");

  return (
    <main>
      <section className="bg-brand-teal text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:px-6">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide">
            Brunswick, Georgia
          </span>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Cold-pressed juice, pressed fresh in small batches.
          </h1>
          <p className="max-w-xl text-lg text-white/85">
            No shortcuts, no concentrate — just fruit, vegetables, and ginger, pressed and
            bottled by hand. Order online or grab a bottle at the market.
          </p>
          <Link
            to="/shop"
            className="rounded-full bg-brand-orange px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-orange-dark"
          >
            Shop the lineup
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Fan favorites</h2>
          <Link to="/shop" className="text-sm font-medium text-brand-teal hover:underline">
            View full shop →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-semibold text-brand-teal">Cold-pressed, not heated</h3>
            <p className="mt-2 text-sm text-brand-grey">
              Hydraulic pressing keeps more nutrients intact than heat-pasteurized juice — every
              bottle is made in small batches, never from concentrate.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-brand-teal">Made in Brunswick</h3>
            <p className="mt-2 text-sm text-brand-grey">
              Every batch is pressed locally. Find us online, at pop-ups, and around the Sea
              Island and Brunswick area.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-brand-teal">Simple ingredients</h3>
            <p className="mt-2 text-sm text-brand-grey">
              Fruit, vegetables, coconut water, and ginger — nothing you can't pronounce, nothing
              added that doesn't need to be there.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
