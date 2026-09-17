import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("shop", "routes/shop.tsx"),
  route("shop/:slug", "routes/product.tsx"),
  route("cart", "routes/cart.tsx"),
  route("checkout", "routes/checkout.tsx"),
  route("checkout/setup-needed", "routes/checkout-setup-needed.tsx"),
  route("checkout/success", "routes/checkout-success.tsx"),
  route("checkout/error", "routes/checkout-error.tsx"),
] satisfies RouteConfig;
