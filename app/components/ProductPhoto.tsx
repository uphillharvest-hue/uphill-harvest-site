import type { Product } from "../data/products";
import { productImages, gallonImage } from "../data/product-images";
import { ProductArt } from "./ProductArt";

/**
 * Renders the real product photo when one exists for this product (and, for
 * juices sold by the Gallon, swaps in the gallon jug shot), falling back to
 * the placeholder <ProductArt> glyph for anything not yet photographed.
 */
export function ProductPhoto({
  product,
  sizeLabel,
  className,
}: {
  product: Product;
  sizeLabel?: string;
  className?: string;
}) {
  const src = sizeLabel === "Gallon" ? gallonImage : productImages[product.slug];

  if (!src) {
    return <ProductArt product={product} className={className} />;
  }

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-2xl bg-white ${className ?? ""}`}
    >
      <img
        src={src}
        alt={`${product.name} bottle`}
        className="h-full w-full object-contain p-4"
      />
    </div>
  );
}
