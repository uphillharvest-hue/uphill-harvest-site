import { Link } from "react-router";
import type { Route } from "./+types/checkout-setup-needed";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Checkout coming soon — UPHILL HARVEST" }];
}

export default function CheckoutSetupNeeded() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-bold">Checkout isn't connected yet</h1>
      <p className="mt-3 text-brand-grey">
        This store's Square account hasn't been linked up on the backend yet, so online
        checkout is temporarily unavailable. Your cart is safe — try again soon.
      </p>
      <Link
        to="/shop"
        className="mt-6 inline-block rounded-full bg-brand-teal px-6 py-3 font-medium text-white hover:bg-brand-teal-dark"
      >
        Back to shop
      </Link>
    </main>
  );
}
