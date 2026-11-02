import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-black/5 bg-brand-black text-brand-cream">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-bold tracking-tight">
              UPHILL <span className="text-brand-orange">HARVEST</span>
            </p>
            <p className="mt-2 max-w-xs text-sm text-brand-cream/70">
              Small-batch cold-pressed juices, made in Brunswick, Georgia.
            </p>
          </div>
          <div className="text-sm text-brand-cream/70">
            <p>Brunswick, GA</p>
            <p className="mt-1">
              <a href="mailto:info@uphillnutrition.us" className="hover:text-brand-orange">
  info@uphillnutrition.us
              </a>
            </p>
            <p className="mt-3">
              Training:{" "}
              <a
                href="https://uphillfitnessga.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-cream hover:text-brand-orange"
              >
                Uphill Fitness →
              </a>
            </p>
            <p className="mt-1">
              Brunch:{" "}
              <a
                href="https://wraphappyonline.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-cream hover:text-brand-orange"
              >
                Wrap Happy →
              </a>
            </p>
          </div>
        </div>
        <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-cream/80">
          <Link to="/shop" className="hover:text-brand-orange">Shop</Link>
          <Link to="/shop#bulk" className="hover:text-brand-orange">Bulk deals</Link>
          <Link to="/shop#cleanses" className="hover:text-brand-orange">Cleanses</Link>
          <Link to="/subscribe" className="hover:text-brand-orange">Subscribe &amp; Save</Link>
          <Link to="/partners" className="hover:text-brand-orange">Wholesale, Events &amp; Private Label</Link>
        </nav>
        <p className="mt-8 text-xs text-brand-cream/40">
          © {new Date().getFullYear()} UPHILL HARVEST. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
