// UPHILL HARVEST product catalog
//
// PLACEHOLDER PRICING — every `priceCents` below is a placeholder and needs
// to be confirmed/replaced with real prices before launch. Recipes are
// pulled from prior notes; a couple are flagged as UNCONFIRMED because more
// than one version existed — double check these before going live.

export type ProductCategory = "bottle" | "shot";

export interface Product {
  slug: string;
  name: string;
  category: ProductCategory;
  tagline: string;
  ingredients: string[];
  description: string;
  priceCents: number;
  sizeLabel: string;
  accent: string; // brand accent color for placeholder art, keyed to ingredients
  confirmed: boolean; // false = recipe/name needs a sanity check with Davon
}

export const products: Product[] = [
  {
    slug: "beet-boost",
    name: "Beet Boost",
    category: "bottle",
    tagline: "Earthy, sweet, and built for endurance.",
    ingredients: ["Apple", "Pineapple", "Beet", "Coconut Water"],
    description:
      "A deep-red blend of apple and pineapple sweetness balanced by earthy beet, rounded out with coconut water for natural electrolytes.",
    priceCents: 900,
    sizeLabel: "16 oz",
    accent: "#B0224D",
    confirmed: false,
  },
  {
    slug: "sunrise-blend",
    name: "Sunrise Blend",
    category: "bottle",
    tagline: "Bright citrus and ginger to start the day.",
    ingredients: ["Apple", "Carrot", "Pineapple", "Ginger", "Coconut Water"],
    description:
      "A golden-orange morning blend — apple and carrot sweetness with pineapple brightness and a ginger kick.",
    priceCents: 900,
    sizeLabel: "16 oz",
    accent: "#E8791A",
    confirmed: true,
  },
  {
    slug: "island-glow",
    name: "Island Glow",
    category: "bottle",
    tagline: "Tropical mango and pineapple, coconut smooth.",
    ingredients: ["Mango", "Pineapple", "Coconut Water"],
    description:
      "Sunny mango and pineapple over coconut water, finished with a touch of lime and sea salt.",
    priceCents: 900,
    sizeLabel: "16 oz",
    accent: "#F2A93B",
    confirmed: true,
  },
  {
    slug: "green-goddess",
    name: "Green Goddess",
    category: "bottle",
    tagline: "Crisp greens with a bright ginger edge.",
    ingredients: ["Spinach", "Green Apple", "Ginger", "Cucumber", "Coconut Water"],
    description:
      "Spinach and cucumber keep it crisp, green apple adds sweetness, and ginger brings the heat.",
    priceCents: 950,
    sizeLabel: "16 oz",
    accent: "#3F7D3A",
    confirmed: true,
  },
  {
    slug: "green-reset",
    name: "Green Reset",
    category: "bottle",
    tagline: "Clean, savory, and quietly fiery.",
    ingredients: ["Cucumber", "Celery", "Spinach", "Coconut Water", "Cayenne"],
    description:
      "A cleansing cucumber-celery-spinach base over coconut water, with a whisper of cayenne on the finish.",
    priceCents: 950,
    sizeLabel: "16 oz",
    accent: "#2F6B4F",
    confirmed: true,
  },
  {
    slug: "green-ignite",
    name: "Green Ignite",
    category: "bottle",
    tagline: "The bold, spicy sibling of Green Reset.",
    ingredients: ["Green Apple", "Cucumber", "Spinach", "Coconut Water", "Ginger", "Cayenne"],
    description:
      "Green apple and cucumber carry fresh ginger juice and a real cayenne kick — for the heat-seekers.",
    priceCents: 1000,
    sizeLabel: "16 oz",
    accent: "#4A8B2C",
    confirmed: true,
  },
  {
    slug: "pineapple-ginger-cleanse",
    name: "Pineapple Ginger Cleanse",
    category: "bottle",
    tagline: "Sweet-hot and straightforward.",
    ingredients: ["Pineapple", "Ginger"],
    description: "Just two ingredients — ripe pineapple and fresh ginger juice, unfiltered.",
    priceCents: 900,
    sizeLabel: "16 oz",
    accent: "#D9A400",
    confirmed: false,
  },
  {
    slug: "watermelon-flow",
    name: "Watermelon Flow",
    category: "bottle",
    tagline: "Hydrating watermelon with a beet undertone.",
    ingredients: ["Watermelon", "Beet"],
    description: "Mostly watermelon for hydration, with just enough beet to deepen the color and flavor.",
    priceCents: 850,
    sizeLabel: "16 oz",
    accent: "#E1436B",
    confirmed: true,
  },
  {
    slug: "berry-rise",
    name: "Berry Rise",
    category: "bottle",
    tagline: "Apple and raspberry, beet-deepened.",
    ingredients: ["Apple", "Raspberry", "Beet", "Coconut Water"],
    description: "Apple juice carries raspberry and beet into a rich, berry-forward glass.",
    priceCents: 950,
    sizeLabel: "16 oz",
    accent: "#8C2244",
    confirmed: true,
  },
  {
    slug: "ginger-essence",
    name: "Ginger Essence",
    category: "shot",
    tagline: "Pure cold-pressed ginger. Nothing else.",
    ingredients: ["Ginger"],
    description: "100% pure cold-pressed ginger juice — a sharp, warming wellness shot.",
    priceCents: 400,
    sizeLabel: "2 oz",
    accent: "#C77A1F",
    confirmed: true,
  },
  {
    slug: "island-fire",
    name: "Island Fire",
    category: "shot",
    tagline: "Ginger, pineapple, lemon — lit.",
    ingredients: ["Ginger", "Pineapple", "Lemon"],
    description: "A fiery little shot of ginger rounded out with pineapple and fresh lemon.",
    priceCents: 400,
    sizeLabel: "2 oz",
    accent: "#E8600C",
    confirmed: true,
  },
  {
    slug: "sunrise-boost",
    name: "Sunrise Boost",
    category: "shot",
    tagline: "Apple, carrot, ginger in a single shot.",
    ingredients: ["Apple", "Carrot", "Ginger"],
    description: "The Sunrise Blend flavor profile, concentrated into a 2 oz wellness shot.",
    priceCents: 400,
    sizeLabel: "2 oz",
    accent: "#E29A2E",
    confirmed: true,
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
