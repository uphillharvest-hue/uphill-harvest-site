import { data, redirect } from "react-router";
import type { Route } from "./+types/order-by-email";
import type { CartLine } from "../context/cart-context";
import { cloudflareContext } from "../lib/cloudflare-context";
import { EmailOrderNotConfiguredError, sendOrderEmail } from "../lib/email-order";

// This route has no UI of its own — like /checkout, it's a server action.
// Instead of building a Square payment link, it emails the order details to
// the site owner and sends the customer to a confirmation page. Temporary
// workaround while Square checkout is down (see README).
export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const raw = formData.get("cart");

  let cart: CartLine[] = [];
  try {
    cart = raw ? JSON.parse(String(raw)) : [];
  } catch {
    throw data("Could not read your cart. Please try again from the cart page.", {
      status: 400,
    });
  }

  if (cart.length === 0) {
    throw data("Your cart is empty.", { status: 400 });
  }

  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim();
  if (!customerName || !customerEmail) {
    throw data("Missing your name or email. Please start from your cart.", { status: 400 });
  }
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const fulfillmentType = formData.get("fulfillmentType") === "SHIPMENT" ? "SHIPMENT" : "PICKUP";

  const shippingAddress =
    fulfillmentType === "SHIPMENT"
      ? {
          street1: String(formData.get("street1") ?? "").trim(),
          street2: String(formData.get("street2") ?? "").trim(),
          city: String(formData.get("city") ?? "").trim(),
          state: String(formData.get("state") ?? "")
            .trim()
            .toUpperCase(),
          zip: String(formData.get("zip") ?? "").trim(),
        }
      : undefined;

  if (fulfillmentType === "SHIPMENT" && !shippingAddress?.street1) {
    throw data("Missing shipping address. Please start from your cart.", { status: 400 });
  }

  const { env } = context.get(cloudflareContext);

  try {
    await sendOrderEmail(env, {
      cart,
      customerName,
      customerEmail,
      customerPhone,
      fulfillmentType,
      shippingAddress,
      notes,
    });
  } catch (err) {
    if (err instanceof EmailOrderNotConfiguredError) {
      console.error("Order-by-email is not configured (missing RESEND_API_KEY / ORDER_NOTIFY_EMAIL).");
    } else {
      console.error("Failed to send order email:", err);
    }
    return redirect("/order-by-email/error");
  }

  return redirect("/order-by-email/sent");
}
