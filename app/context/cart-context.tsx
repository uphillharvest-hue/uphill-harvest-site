import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getProduct } from "../data/products";

export interface CartLine {
  slug: string;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  addItem: (slug: string, quantity?: number) => void;
  removeItem: (slug: string) => void;
  setQuantity: (slug: string, quantity: number) => void;
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

  const addItem = (slug: string, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.slug === slug);
      if (existing) {
        return prev.map((l) =>
          l.slug === slug ? { ...l, quantity: l.quantity + quantity } : l,
        );
      }
      return [...prev, { slug, quantity }];
    });
  };

  const removeItem = (slug: string) => {
    setLines((prev) => prev.filter((l) => l.slug !== slug));
  };

  const setQuantity = (slug: string, quantity: number) => {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => l.slug !== slug);
      return prev.map((l) => (l.slug === slug ? { ...l, quantity } : l));
    });
  };

  const clear = () => setLines([]);

  const { totalItems, totalCents } = useMemo(() => {
    let items = 0;
    let cents = 0;
    for (const line of lines) {
      const product = getProduct(line.slug);
      if (!product) continue;
      items += line.quantity;
      cents += product.priceCents * line.quantity;
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
