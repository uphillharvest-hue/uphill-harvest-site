import { Link } from "react-router";
import type { Route } from "./+types/checkout-error";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Checkout error — UPHILL HARVEST" }];
}

export default function CheckoutError() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-brand-grey">
        We couldn't start checkout just now. Your card was not charged. Please try again in a
        moment.
      </p>
      <Link
        to="/cart"
        className="mt-6 inline-block rounded-full bg-brand-teal px-6 py-3 font-medium text-white hover:bg-brand-teal-dark"
      >
        Back to cart
      </Link>
    </main>
  );
}
