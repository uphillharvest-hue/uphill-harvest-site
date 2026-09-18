import type { Route } from "./+types/shop";
import { products } from "../data/products";
import { ProductCard } from "../components/ProductCard";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Shop — UPHILL HARVEST" }];
}

export default function Shop() {
  const juices = products.filter((p) => p.category === "juice");
  const shots = products.filter((p) => p.category === "shot");

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Shop</h1>
      <p className="mt-2 max-w-xl text-brand-grey">
        Every bottle is pressed in small batches. Pick your favorites and add them to your cart.
      </p>

      <section id="juices" className="mt-12 scroll-mt-24">
        <h2 className="mb-6 text-xl font-semibold">Juices — 12 oz, 16 oz &amp; Gallon</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {juices.map((product) => (
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
