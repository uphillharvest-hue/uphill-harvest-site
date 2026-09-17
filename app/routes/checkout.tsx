import { data, redirect } from "react-router";
import type { Route } from "./+types/checkout";
import { getProduct } from "../data/products";
import { cloudflareContext } from "../lib/cloudflare-context";

interface CartLineInput {
  slug: string;
  quantity: number;
}

// This route has no UI of its own — it's a server action that builds a
// Square-hosted checkout session and redirects the customer to it.
export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const raw = formData.get("cart");

  let lines: CartLineInput[] = [];
  try {
    lines = raw ? JSON.parse(String(raw)) : [];
  } catch {
    throw data("Could not read your cart. Please try again from the cart page.", {
      status: 400,
    });
  }

  const lineItems = lines
    .map((line) => {
      const product = getProduct(line.slug);
      if (!product || line.quantity <= 0) return null;
      return {
        name: product.name,
        quantity: String(line.quantity),
        base_price_money: {
          amount: product.priceCents,
          currency: "USD",
        },
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (lineItems.length === 0) {
    throw data("Your cart is empty.", { status: 400 });
  }

  const { env } = context.get(cloudflareContext);
  const accessToken = env.SQUARE_ACCESS_TOKEN;
  const locationId = env.SQUARE_LOCATION_ID;

  // Square isn't connected yet — send the customer somewhere honest instead
  // of a broken checkout, and let the site owner know what's missing.
  if (!accessToken || !locationId || locationId === "REPLACE_WITH_SQUARE_LOCATION_ID") {
    return redirect("/checkout/setup-needed");
  }

  const apiBase =
    (env.SQUARE_ENVIRONMENT as string) === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

  const origin = new URL(request.url).origin;

  const squareResponse = await fetch(`${apiBase}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Check developer.squareup.com for the current API version before launch.
      "Square-Version": "2025-09-17",
    },
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      order: {
        location_id: locationId,
        line_items: lineItems,
      },
      checkout_options: {
        redirect_url: `${origin}/checkout/success`,
      },
    }),
  });

  if (!squareResponse.ok) {
    const errorBody = await squareResponse.text();
    console.error("Square payment link creation failed:", errorBody);
    return redirect("/checkout/error");
  }

  const result = (await squareResponse.json()) as {
    payment_link?: { url?: string };
  };

  const checkoutUrl = result.payment_link?.url;
  if (!checkoutUrl) {
    return redirect("/checkout/error");
  }

  return redirect(checkoutUrl);
}
