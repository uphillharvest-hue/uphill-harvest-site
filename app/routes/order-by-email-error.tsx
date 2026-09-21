import { Link } from "react-router";
import type { Route } from "./+types/order-by-email-error";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Couldn't send your order — UPHILL HARVEST" }];
}

export default function OrderByEmailError() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-bold">We couldn't send your order</h1>
      <p className="mt-3 text-brand-grey">
        Something went wrong emailing your order. Your cart is safe — please try again in a
        moment, or reach UPHILL HARVEST directly at{" "}
        <a href="tel:+19122233475" className="font-medium text-brand-teal">
          912-223-3475
        </a>{" "}
        or{" "}
        <a href="mailto:uphillharvest@gmail.com" className="font-medium text-brand-teal">
          uphillharvest@gmail.com
        </a>
        .
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
