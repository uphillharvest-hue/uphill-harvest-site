import { useEffect } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/order-by-email-sent";
import { useCart } from "../context/cart-context";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Order sent — UPHILL HARVEST" }];
}

export default function OrderByEmailSent() {
  const { clear } = useCart();

  // The order has been emailed and this page is only reachable after that
  // succeeded, so the cart's job is done — clear it like a normal checkout
  // would.
  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-bold">We got your order!</h1>
      <p className="mt-3 text-brand-grey">
        Your order details were emailed to UPHILL HARVEST. Online payment is temporarily down, so
        Davon will reach out shortly by phone or email to confirm details and collect payment.
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
