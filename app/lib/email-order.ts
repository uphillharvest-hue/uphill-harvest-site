// Emails a submitted order to the site owner instead of charging a card.
// This is the workaround for special/bulk orders and pre-purchase questions
// (see cart.tsx) — customers fill out the cart page's "Special or bulk
// order? Have a question?" form instead of paying online, and Davon follows
// up to collect payment and confirm details directly.
//
// Uses Resend (https://resend.com). Orders to the shop, and the customer's
// own thank-you confirmation, are both sent from a verified sending domain
// (mail.uphillnutrition.us) so Resend can deliver to any customer address,
// not just the account's own inbox.
import { getProduct, getSize, formatPrice } from "../data/products";
import type { CartLine } from "../context/cart-context";

export class EmailOrderNotConfiguredError extends Error {}
export class EmailOrderSendError extends Error {}

const SENDER = "UPHILL HARVEST <orders@mail.uphillnutrition.us>";

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

async function sendViaResend(
  apiKey: string,
  payload: { to: string[]; replyTo?: string; subject: string; text: string; html: string },
): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: SENDER,
      to: payload.to,
      reply_to: payload.replyTo || undefined,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new EmailOrderSendError(body);
  }
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

  // ---------------------------------------------------------------------
  // 1. Notify the shop (uphillharvest@gmail.com) — unchanged behavior.
  // ---------------------------------------------------------------------
  const textLines = [
    `New special order / inquiry submitted by email`,
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
    <h2>New special order / inquiry submitted by email</h2>
    <p><em>This order was NOT paid online. Follow up with the customer to collect payment.</em></p>
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

  try {
    await sendViaResend(env.RESEND_API_KEY, {
      to: [env.ORDER_NOTIFY_EMAIL],
      replyTo: order.customerEmail || undefined,
      subject: `New order (email) — ${order.customerName} — ${formatPrice(totalCents)}`,
      text,
      html,
    });
  } catch (err) {
    console.error("Resend order email (shop) failed:", err);
    throw err instanceof EmailOrderSendError ? err : new EmailOrderSendError(String(err));
  }

  // ---------------------------------------------------------------------
  // 2. Thank the customer — best-effort. If this fails, we don't want to
  // break the order flow for the customer or block the shop notification
  // above, which already succeeded. We just log it.
  // ---------------------------------------------------------------------
  if (order.customerEmail) {
    try {
      const customerFirstName = order.customerName.trim().split(/\s+/)[0] || order.customerName;

      const customerTextLines = [
        `Hi ${customerFirstName},`,
        ``,
        `Thank you for your order with UPHILL HARVEST! We've received your details, and our team will reach out shortly by phone or email to confirm everything and collect payment.`,
        ``,
        `Here's a summary of what you ordered:`,
        ``,
        ...itemLines.map((l) => `  - ${l}`),
        ``,
        `Total: ${formatPrice(totalCents)}`,
        ...fulfillmentLines,
        ``,
        `Our juices are cold-pressed fresh to order, so we appreciate your patience while we get yours ready.`,
        ``,
        `Questions in the meantime? Just reply to this email or call 912-223-3475.`,
        ``,
        `— UPHILL HARVEST`,
        `uphillnutrition.us`,
      ];

      const customerText = customerTextLines.join("\n");

      const customerHtml = `
        <p>Hi ${escapeHtml(customerFirstName)},</p>
        <p>Thank you for your order with <strong>UPHILL HARVEST</strong>! We've received your details, and our team will reach out shortly by phone or email to confirm everything and collect payment.</p>
        <p><strong>Here's a summary of what you ordered:</strong></p>
        <ul>
          ${itemLines.map((l) => `<li>${escapeHtml(l)}</li>`).join("\n")}
        </ul>
        <p><strong>Total: ${formatPrice(totalCents)}</strong></p>
        <p>${fulfillmentLines.map((l) => escapeHtml(l)).join("<br/>")}</p>
        <p>Our juices are cold-pressed fresh to order, so we appreciate your patience while we get yours ready.</p>
        <p>Questions in the meantime? Just reply to this email or call 912-223-3475.</p>
        <p>— UPHILL HARVEST<br/>uphillnutrition.us</p>
      `.trim();

      await sendViaResend(env.RESEND_API_KEY, {
        to: [order.customerEmail],
        replyTo: env.ORDER_NOTIFY_EMAIL,
        subject: `Thanks for your order, ${customerFirstName}!`,
        text: customerText,
        html: customerHtml,
      });
    } catch (err) {
      console.error("Resend order email (customer thank-you) failed:", err);
      // Intentionally not re-thrown — the shop was already notified above.
    }
  }
}
