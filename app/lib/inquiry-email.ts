// Emails a form submission (subscription sign-up, wholesale / event /
// private-label inquiry) to the shop, plus a best-effort confirmation to the
// customer. Same Resend setup as email-order.ts.
import {
  EmailOrderNotConfiguredError,
  EmailOrderSendError,
  escapeHtml,
  sendViaResend,
} from "./email-order";

export interface Inquiry {
  /** e.g. "Subscription request" — used in the shop's subject line. */
  kind: string;
  customerName: string;
  customerEmail: string;
  /** Label/value pairs, in order. Empty values are skipped. */
  fields: [string, string][];
  /** Confirmation email to the customer. */
  confirmation: { subject: string; intro: string };
}

export async function sendInquiryEmail(
  env: { RESEND_API_KEY?: string; ORDER_NOTIFY_EMAIL?: string },
  inquiry: Inquiry,
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.ORDER_NOTIFY_EMAIL) {
    throw new EmailOrderNotConfiguredError();
  }
  const fields = inquiry.fields.filter(([, v]) => v.trim() !== "");
  const text = [
    `New ${inquiry.kind.toLowerCase()} from the website`,
    ``,
    ...fields.map(([k, v]) => `${k}: ${v}`),
    ``,
    `Reply to this email to reach the customer.`,
  ].join("\n");
  const rows = fields
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;vertical-align:top"><strong>${escapeHtml(k)}</strong></td><td style="padding:4px 0">${escapeHtml(v).replace(/\n/g, "<br/>")}</td></tr>`,
    )
    .join("\n");
  const html = `<h2>New ${escapeHtml(inquiry.kind.toLowerCase())} from the website</h2><table>${rows}</table><p>Reply to this email to reach the customer.</p>`;

  try {
    await sendViaResend(env.RESEND_API_KEY, {
      to: [env.ORDER_NOTIFY_EMAIL],
      replyTo: inquiry.customerEmail,
      subject: `${inquiry.kind} — ${inquiry.customerName}`,
      text,
      html,
    });
  } catch (err) {
    console.error(`Resend ${inquiry.kind} email (shop) failed:`, err);
    throw err instanceof EmailOrderSendError ? err : new EmailOrderSendError(String(err));
  }

  // Best-effort thank-you to the customer; the shop already has the details.
  try {
    const first = inquiry.customerName.trim().split(/\s+/)[0] || inquiry.customerName;
    const summary = fields.filter(([k]) => !/^(name|email|phone)$/i.test(k));
    const custText = [
      `Hi ${first},`,
      ``,
      inquiry.confirmation.intro,
      ``,
      `What you sent us:`,
      ...summary.map(([k, v]) => `  ${k}: ${v}`),
      ``,
      `Questions in the meantime? Just reply to this email or call 912-223-3475.`,
      ``,
      `— UPHILL HARVEST`,
      `uphillnutrition.us`,
    ].join("\n");
    const custHtml = `<p>Hi ${escapeHtml(first)},</p><p>${escapeHtml(inquiry.confirmation.intro)}</p><p><strong>What you sent us:</strong></p><ul>${summary
      .map(([k, v]) => `<li><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</li>`)
      .join("")}</ul><p>Questions in the meantime? Just reply to this email or call 912-223-3475.</p><p>— UPHILL HARVEST<br/>uphillnutrition.us</p>`;
    await sendViaResend(env.RESEND_API_KEY, {
      to: [inquiry.customerEmail],
      replyTo: env.ORDER_NOTIFY_EMAIL,
      subject: inquiry.confirmation.subject,
      text: custText,
      html: custHtml,
    });
  } catch (err) {
    console.error(`Resend ${inquiry.kind} email (customer) failed:`, err);
  }
}
