// Emails a submitted order to the site owner instead of charging a card.
// This is the temporary workaround while Square checkout is broken in
// production (see checkout.tsx) — customers fill out the cart page's
// "Email us your order" form instead of paying online, and Davon follows up
// to collect payment and confirm details directly.
//
// Uses Resend (https://resend.com) because it needs no DNS/domain setup to
// get working: sign up free with the inbox you want orders to land in (e.g.
// uphillharvest@gmail.com), grab an API key, and Resend's shared
// `onboarding@resend.dev` sender can send TO that same inbox with no
// verification step. (It can only send to the account's own address until a
// custom domain is verified — which is exactly what we want here, since
// every order email goes to one fixed inbox.)
import { getProduct, getSize, formatPrice } from "../data/products";
import type { CartLine } from "../context/cart-context";

export class EmailOrderNotConfiguredError extends Error {}
export class EmailOrderSendError extends Error {}

export interface OrderLineItem {
  name: string;
  sizeLabel: string;
  quantity: number;
  priceCents: number;
}

export interface EmailedOrder {
  cart: CartLine[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  fulfillmentType: "PICKUP" | "SHIPMENT";
  shippingAddress?: {
    street1: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
  };
  notes: string;
}

// Recomputes line items + total server-side from the product catalog rather
// than trusting anything the client sent about pricing.
export function summarizeOrder(cart: CartLine[]): { items: OrderLineItem[]; totalCents: number } {
  const items: OrderLineItem[] = [];
  let totalCents = 0;

  for (const line of cart) {
    const product = getProduct(line.slug);
    const size = product && getSize(product, line.sizeLabel);
    if (!product || !size || line.quantity <= 0) continue;
    items.push({
      name: product.name,
      sizeLabel: size.label,
      quantity: line.quantity,
      priceCents: size.priceCents,
    });
    totalCents += size.priceCents * line.quantity;
  }

  return { items, totalCents };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendOrderEmail(
  env: { RESEND_API_KEY?: string; ORDER_NOTIFY_EMAIL?: string },
  order: EmailedOrder,
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.ORDER_NOTIFY_EMAIL) {
    throw new EmailOrderNotConfiguredError();
  }

  const { items, totalCents } = summarizeOrder(order.cart);
  if (items.length === 0) {
    throw new EmailOrderSendError("Cart was empty.");
  }

  const itemLines = items.map(
    (item) => `${item.quantity} × ${item.name} (${item.sizeLabel}) — ${formatPrice(item.priceCents * item.quantity)}`,
  );

  const fulfillmentLines =
    order.fulfillmentType === "PICKUP"
      ? ["Fulfillment: Pick up locally"]
      : [
          "Fulfillment: Ship",
          order.shippingAddress
            ? [
                order.shippingAddress.street1,
                order.shippingAddress.street2,
                `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}`,
              ]
                .filter(Boolean)
                .join(", ")
            : "(no address given)",
        ];

  const textLines = [
    `New order submitted by email (Square checkout workaround)`,
    ``,
    `Customer: ${order.customerName}`,
    `Email: ${order.customerEmail}`,
    order.customerPhone ? `Phone: ${order.customerPhone}` : null,
    ``,
    ...fulfillmentLines,
    ``,
    `Items:`,
    ...itemLines.map((l) => `  - ${l}`),
    ``,
    `Total: ${formatPrice(totalCents)}`,
    order.notes ? `` : null,
    order.notes ? `Notes: ${order.notes}` : null,
    ``,
    `This order was NOT paid online — follow up with the customer to collect payment.`,
  ].filter((l): l is string => l !== null);

  const text = textLines.join("\n");

  const html = `
    <h2>New order submitted by email</h2>
    <p><em>Square checkout workaround — this order was NOT paid online. Follow up with the customer to collect payment.</em></p>
    <p>
      <strong>Customer:</strong> ${escapeHtml(order.customerName)}<br/>
      <strong>Email:</strong> ${escapeHtml(order.customerEmail)}<br/>
      ${order.customerPhone ? `<strong>Phone:</strong> ${escapeHtml(order.customerPhone)}<br/>` : ""}
    </p>
    <p>${fulfillmentLines.map((l) => escapeHtml(l)).join("<br/>")}</p>
    <p><strong>Items:</strong></p>
    <ul>
      ${itemLines.map((l) => `<li>${escapeHtml(l)}</li>`).join("\n")}
    </ul>
    <p><strong>Total: ${formatPrice(totalCents)}</strong></p>
    ${order.notes ? `<p><strong>Notes:</strong> ${escapeHtml(order.notes)}</p>` : ""}
  `.trim();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "UPHILL HARVEST Orders <onboarding@resend.dev>",
      to: [env.ORDER_NOTIFY_EMAIL],
      reply_to: order.customerEmail || undefined,
      subject: `New order (email) — ${order.customerName} — ${formatPrice(totalCents)}`,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Resend order email failed:", body);
    throw new EmailOrderSendError(body);
  }
}
