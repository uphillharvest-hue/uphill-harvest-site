import { Link } from "react-router";
import { useCart } from "../context/cart-context";

export function Header() {
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-brand-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">
            UPHILL <span className="text-brand-orange">HARVEST</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium sm:flex">
          <Link to="/shop" className="hover:text-brand-teal">
            Shop
          </Link>
          <Link to="/shop#juices" className="hover:text-brand-teal">
            Juices
          </Link>
          <Link to="/shop#shots" className="hover:text-brand-teal">
            Wellness Shots
          </Link>
        </nav>
        <Link
          to="/cart"
          className="relative flex items-center gap-2 rounded-full border border-brand-black/10 bg-white px-4 py-2 text-sm font-medium shadow-sm"
        >
          Cart
          {totalItems > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1 text-xs font-semibold text-white">
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
