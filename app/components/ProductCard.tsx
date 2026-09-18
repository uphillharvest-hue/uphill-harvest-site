import { useState } from "react";
import { Link } from "react-router";
import type { Product } from "../data/products";
import { formatPrice } from "../data/products";
import { ProductArt } from "./ProductArt";
import { useCart } from "../context/cart-context";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [sizeLabel, setSizeLabel] = useState(product.sizes[0].label);
  const selectedSize = product.sizes.find((s) => s.label === sizeLabel) ?? product.sizes[0];

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:shadow-md">
      <Link to={`/shop/${product.slug}`} className="block">
        <ProductArt product={product} className="h-48 w-full" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <Link to={`/shop/${product.slug}`} className="hover:text-brand-teal">
          <h3 className="text-lg font-semibold leading-tight">{product.name}</h3>
        </Link>
        <p className="text-sm text-brand-grey">{product.tagline}</p>
        <p className="text-xs uppercase tracking-wide text-brand-grey/70">
          {product.ingredients.join(" · ")}
        </p>

        <div className="mt-auto flex flex-col gap-3 pt-3">
          {product.sizes.length > 1 ? (
            <div className="flex gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size.label}
                  type="button"
                  onClick={() => setSizeLabel(size.label)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    size.label === sizeLabel
                      ? "border-brand-teal bg-brand-teal text-white"
                      : "border-black/10 text-brand-grey hover:border-brand-teal"
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">{formatPrice(selectedSize.priceCents)}</span>
            <button
              type="button"
              onClick={() => addItem(product.slug, sizeLabel)}
              className="rounded-full bg-brand-teal px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-teal-dark"
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
