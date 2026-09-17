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
              <a href="mailto:hello@uphillnutrition.us" className="hover:text-brand-orange">
                hello@uphillnutrition.us
              </a>
            </p>
          </div>
        </div>
        <p className="mt-8 text-xs text-brand-cream/40">
          © {new Date().getFullYear()} UPHILL HARVEST. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
