import type { Product } from "../data/products";

/**
 * Placeholder product art. Renders a clean color-coded bottle/shot glyph
 * keyed to the product's accent color. Swap this out once real product
 * photos are available — see <ProductPhoto> usage note in ProductCard.
 */
export function ProductArt({ product, className }: { product: Product; className?: string }) {
  const isShot = product.category === "shot";
  return (
    <div
      className={`flex items-center justify-center rounded-2xl ${className ?? ""}`}
      style={{
        background: `linear-gradient(160deg, ${product.accent}22 0%, ${product.accent}44 100%)`,
      }}
      aria-hidden="true"
    >
      <svg
        width={isShot ? "44" : "60"}
        height={isShot ? "72" : "120"}
        viewBox={isShot ? "0 0 44 72" : "0 0 60 120"}
        fill="none"
      >
        {isShot ? (
          <>
            <rect x="8" y="16" width="28" height="52" rx="6" fill={product.accent} fillOpacity="0.85" />
            <rect x="14" y="6" width="16" height="12" rx="3" fill={product.accent} />
          </>
        ) : (
          <>
            <rect x="12" y="30" width="36" height="84" rx="8" fill={product.accent} fillOpacity="0.85" />
            <rect x="20" y="10" width="20" height="22" rx="4" fill={product.accent} />
            <rect x="22" y="2" width="16" height="10" rx="3" fill="#14161a" fillOpacity="0.6" />
          </>
        )}
      </svg>
    </div>
  );
}
