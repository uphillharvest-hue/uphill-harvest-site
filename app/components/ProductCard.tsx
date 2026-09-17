import { Link } from "react-router";
import type { Product } from "../data/products";
import { formatPrice } from "../data/products";
import { ProductArt } from "./ProductArt";
import { useCart } from "../context/cart-context";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:shadow-md">
      <Link to={`/shop/${product.slug}`} className="block">
        <ProductArt product={product} className="h-48 w-full" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/shop/${product.slug}`} className="hover:text-brand-teal">
            <h3 className="text-lg font-semibold leading-tight">{product.name}</h3>
          </Link>
          <span className="whitespace-nowrap text-sm font-medium text-brand-grey">
            {product.sizeLabel}
          </span>
        </div>
        <p className="text-sm text-brand-grey">{product.tagline}</p>
        <p className="text-xs uppercase tracking-wide text-brand-grey/70">
          {product.ingredients.join(" · ")}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-semibold">{formatPrice(product.priceCents)}</span>
          <button
            type="button"
            onClick={() => addItem(product.slug)}
            className="rounded-full bg-brand-teal px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-teal-dark"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
