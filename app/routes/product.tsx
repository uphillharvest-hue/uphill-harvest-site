import { useState } from "react";
import { data, Link, useNavigate } from "react-router";
import type { Route } from "./+types/product";
import { getProduct, formatPrice } from "../data/products";
import { ProductArt } from "../components/ProductArt";
import { useCart } from "../context/cart-context";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Product — UPHILL HARVEST" }];
  return [{ title: `${loaderData.product.name} — UPHILL HARVEST` }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const product = getProduct(params.slug);
  if (!product) {
    throw data("Not Found", { status: 404 });
  }
  return { product };
}

export default function ProductDetail({ loaderData }: Route.ComponentProps) {
  const { product } = loaderData;
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [sizeLabel, setSizeLabel] = useState(product.sizes[0].label);
  const selectedSize = product.sizes.find((s) => s.label === sizeLabel) ?? product.sizes[0];

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link to="/shop" className="text-sm text-brand-teal hover:underline">
        ← Back to shop
      </Link>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <ProductArt product={product} className="h-80 w-full" />
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="mt-1 text-brand-grey">{product.tagline}</p>

          {product.sizes.length > 1 ? (
            <div className="mt-4 flex gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size.label}
                  type="button"
                  onClick={() => setSizeLabel(size.label)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    size.label === sizeLabel
                      ? "border-brand-teal bg-brand-teal text-white"
                      : "border-black/10 text-brand-grey hover:border-brand-teal"
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-brand-grey">{product.sizes[0].label}</p>
          )}

          <p className="mt-4 text-2xl font-semibold">{formatPrice(selectedSize.priceCents)}</p>

          <p className="mt-6 text-brand-black/80">{product.description}</p>

          <div className="mt-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-grey">
              Ingredients
            </h2>
            <p className="mt-1">{product.ingredients.join(", ")}</p>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => addItem(product.slug, sizeLabel)}
              className="rounded-full bg-brand-teal px-6 py-3 font-medium text-white transition hover:bg-brand-teal-dark"
            >
              Add to cart
            </button>
            <button
              type="button"
              onClick={() => {
                addItem(product.slug, sizeLabel);
                navigate("/cart");
              }}
              className="rounded-full border border-brand-black/15 px-6 py-3 font-medium transition hover:border-brand-black/30"
            >
              Buy now
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
