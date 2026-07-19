import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";

// Razorpay webhook endpoint for subscription events
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  // Verify webhook signature
  if (!signature || !process.env.RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  switch (event.event) {
    case "subscription.activated":
    case "subscription.charged": {
      // Mark user as pro
      const subscriptionId = event.payload.subscription.entity.id;
      const customerId = event.payload.subscription.entity.customer_id;

      // Find user by customer_id stored in metadata or notes
      const notes = event.payload.subscription.entity.notes;
      const userId = notes?.user_id;

      if (userId) {
        await supabase
          .from("profiles")
          .update({
            subscription_status: "active",
            subscription_id: subscriptionId,
            subscription_plan: "pro",
          } as Record<string, unknown>)
          .eq("id", userId);
      }
      break;
    }

    case "subscription.cancelled":
    case "subscription.expired": {
      const notes = event.payload.subscription.entity.notes;
      const userId = notes?.user_id;

      if (userId) {
        await supabase
          .from("profiles")
          .update({
            subscription_status: "inactive",
            subscription_plan: "free",
          } as Record<string, unknown>)
          .eq("id", userId);
      }
      break;
    }

    case "payment.captured": {
      // Payment successful — could log this
      break;
    }
  }

  return NextResponse.json({ status: "ok" });
}
