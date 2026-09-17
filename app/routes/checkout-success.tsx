import { Link } from "react-router";
import type { Route } from "./+types/checkout-success";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Order confirmed — UPHILL HARVEST" }];
}

export default function CheckoutSuccess() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-bold">Thanks for your order!</h1>
      <p className="mt-3 text-brand-grey">
        Your payment went through and your order is confirmed. A receipt is on its way from
        Square.
      </p>
      <Link
        to="/shop"
        className="mt-6 inline-block rounded-full bg-brand-teal px-6 py-3 font-medium text-white hover:bg-brand-teal-dark"
      >
        Keep shopping
      </Link>
    </main>
  );
}
