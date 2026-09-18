import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getProduct, getSize } from "../data/products";

export interface CartLine {
  slug: string;
  sizeLabel: string;
  quantity: number;
}

function lineKey(slug: string, sizeLabel: string) {
  return `${slug}::${sizeLabel}`;
}

interface CartContextValue {
  lines: CartLine[];
  addItem: (slug: string, sizeLabel: string, quantity?: number) => void;
  removeItem: (slug: string, sizeLabel: string) => void;
  setQuantity: (slug: string, sizeLabel: string, quantity: number) => void;
  clear: () => void;
  totalItems: number;
  totalCents: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "uphill-harvest-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart once, client-side only.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupt/unavailable storage
    }
    setHydrated(true);
  }, []);

  // Persist on change (skip the very first render before hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // ignore write failures (private browsing, quota, etc.)
    }
  }, [lines, hydrated]);

  const addItem = (slug: string, sizeLabel: string, quantity = 1) => {
    setLines((prev) => {
      const key = lineKey(slug, sizeLabel);
      const existing = prev.find((l) => lineKey(l.slug, l.sizeLabel) === key);
      if (existing) {
        return prev.map((l) =>
          lineKey(l.slug, l.sizeLabel) === key ? { ...l, quantity: l.quantity + quantity } : l,
        );
      }
      return [...prev, { slug, sizeLabel, quantity }];
    });
  };

  const removeItem = (slug: string, sizeLabel: string) => {
    const key = lineKey(slug, sizeLabel);
    setLines((prev) => prev.filter((l) => lineKey(l.slug, l.sizeLabel) !== key));
  };

  const setQuantity = (slug: string, sizeLabel: string, quantity: number) => {
    const key = lineKey(slug, sizeLabel);
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => lineKey(l.slug, l.sizeLabel) !== key);
      return prev.map((l) => (lineKey(l.slug, l.sizeLabel) === key ? { ...l, quantity } : l));
    });
  };

  const clear = () => setLines([]);

  const { totalItems, totalCents } = useMemo(() => {
    let items = 0;
    let cents = 0;
    for (const line of lines) {
      const product = getProduct(line.slug);
      const size = product && getSize(product, line.sizeLabel);
      if (!product || !size) continue;
      items += line.quantity;
      cents += size.priceCents * line.quantity;
    }
    return { totalItems: items, totalCents: cents };
  }, [lines]);

  return (
    <CartContext.Provider
      value={{ lines, addItem, removeItem, setQuantity, clear, totalItems, totalCents }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
