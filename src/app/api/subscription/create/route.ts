import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Create a Razorpay subscription for the user
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });
  }

  const planId = process.env.RAZORPAY_PLAN_ID;

  if (!planId) {
    return NextResponse.json({ error: "RAZORPAY_PLAN_ID not set" }, { status: 500 });
  }

  try {
    // Create subscription
    const subscriptionResponse = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: planId,
        total_count: 12,
        quantity: 1,
        customer_notify: 1,
        notes: {
          user_id: user.id,
          email: user.email,
        },
      }),
    });

    const responseData = await subscriptionResponse.json();

    if (!subscriptionResponse.ok) {
      console.error("Razorpay error:", JSON.stringify(responseData));
      return NextResponse.json(
        {
          error: responseData.error?.description || "Failed to create subscription",
          details: responseData.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscription_id: responseData.id,
      razorpay_key: process.env.RAZORPAY_KEY_ID,
      subscription_url: responseData.short_url,
    });
  } catch (err) {
    console.error("Subscription creation error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: String(err) },
      { status: 500 }
    );
  }
}
