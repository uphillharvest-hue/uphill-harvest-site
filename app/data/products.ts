// UPHILL HARVEST product catalog — confirmed menu and pricing from Davon.

export type ProductCategory = "juice" | "shot";

export interface ProductSize {
  label: string;
  priceCents: number;
  /**
   * Whether this size can go out via a shipping carrier at all. The Gallon is
   * excluded — a full gallon of chilled juice plus the ice packs/insulation
   * needed to keep it cold in transit is heavy, fragile, and expensive to
   * ship reliably; treat it as local pickup/delivery only for now.
   */
  shippable: boolean;
  /**
   * PLACEHOLDER — packaged weight of a single unit of this size, in ounces
   * (bottle + juice, not counting the shared box/ice-pack overhead in
   * shipping.ts). These are estimates. Weigh an actual bottle on a kitchen
   * scale and correct these once you've packed a real shipment.
   */
  shipWeightOz?: number;
}

export interface Product {
  slug: string;
  name: string;
  category: ProductCategory;
  tagline: string;
  ingredients: string[];
  description: string;
  sizes: ProductSize[];
  accent: string; // brand accent color for placeholder art, keyed to ingredients
}

export const products: Product[] = [
  {
    slug: "island-glow",
    name: "Island Glow",
    category: "juice",
    tagline: "Tropical mango and pineapple, coconut smooth.",
    ingredients: ["Mango", "Pineapple", "Coconut Water"],
    description: "Sunny mango and pineapple over coconut water — tastes like a day off.",
    sizes: [
      { label: "12 oz", priceCents: 700, shippable: true, shipWeightOz: 14 },
      { label: "16 oz", priceCents: 900, shippable: true, shipWeightOz: 18 },
      { label: "Gallon", priceCents: 6500, shippable: false },
    ],
    accent: "#F2A93B",
  },
  {
    slug: "green-goddess",
    name: "Green Goddess",
    category: "juice",
    tagline: "Crisp greens with a bright ginger-cayenne edge.",
    ingredients: ["Green Apple", "Cucumber", "Spinach", "Ginger", "Cayenne"],
    description:
      "Green apple and cucumber keep it crisp, spinach keeps it clean, ginger and cayenne bring the heat.",
    sizes: [
      { label: "12 oz", priceCents: 700, shippable: true, shipWeightOz: 14 },
      { label: "16 oz", priceCents: 900, shippable: true, shipWeightOz: 18 },
      { label: "Gallon", priceCents: 6500, shippable: false },
    ],
    accent: "#3F7D3A",
  },
  {
    slug: "sunrise-blend",
    name: "Sunrise Blend",
    category: "juice",
    tagline: "Bright citrus and ginger to start the day.",
    ingredients: ["Apple", "Carrot", "Pineapple", "Ginger"],
    description:
      "A golden-orange morning blend — apple and carrot sweetness, pineapple brightness, and a ginger kick.",
    sizes: [
      { label: "12 oz", priceCents: 700, shippable: true, shipWeightOz: 14 },
      { label: "16 oz", priceCents: 900, shippable: true, shipWeightOz: 18 },
      { label: "Gallon", priceCents: 6500, shippable: false },
    ],
    accent: "#E8791A",
  },
  {
    slug: "beet-boost-2",
    name: "Beet Boost 2",
    category: "juice",
    tagline: "Earthy, sweet, and built for endurance.",
    ingredients: ["Apple", "Pineapple", "Beet"],
    description: "A deep-red blend of apple and pineapple sweetness balanced by earthy beet.",
    sizes: [
      { label: "12 oz", priceCents: 700, shippable: true, shipWeightOz: 14 },
      { label: "16 oz", priceCents: 900, shippable: true, shipWeightOz: 18 },
      { label: "Gallon", priceCents: 6500, shippable: false },
    ],
    accent: "#B0224D",
  },
  {
    slug: "ginger-essence",
    name: "Ginger Essence",
    category: "shot",
    tagline: "Pure cold-pressed ginger. Nothing else.",
    ingredients: ["Ginger"],
    description: "100% pure cold-pressed ginger juice — a sharp, warming wellness shot.",
    sizes: [{ label: "2 oz", priceCents: 500, shippable: true, shipWeightOz: 3 }],
    accent: "#C77A1F",
  },
  {
    slug: "golden-fire",
    name: "Golden Fire",
    category: "shot",
    tagline: "Pineapple and turmeric, cayenne-lit.",
    ingredients: ["Pineapple", "Ginger", "Lemon", "Turmeric", "Cayenne"],
    description: "Pineapple and turmeric carry a real ginger-cayenne kick — golden and glowing.",
    sizes: [{ label: "2 oz", priceCents: 500, shippable: true, shipWeightOz: 3 }],
    accent: "#E8600C",
  },
  {
    slug: "beet-charge",
    name: "Beet Charge",
    category: "shot",
    tagline: "Beet and apple, ginger-lemon bright.",
    ingredients: ["Beet", "Apple", "Ginger", "Lemon"],
    description: "Earthy beet and apple sweetness, brightened with fresh ginger and lemon.",
    sizes: [{ label: "2 oz", priceCents: 500, shippable: true, shipWeightOz: 3 }],
    accent: "#8C2244",
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getSize(product: Product, sizeLabel: string): ProductSize | undefined {
  return product.sizes.find((s) => s.label === sizeLabel);
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
