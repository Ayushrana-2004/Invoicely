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

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // First, create or fetch a Razorpay plan (Pro plan at ₹199/month)
  // In production, create this once and store the plan_id in env
  const planId = process.env.RAZORPAY_PLAN_ID;

  if (!planId) {
    // Create plan if not exists (do this once manually in production)
    const planResponse = await fetch("https://api.razorpay.com/v1/plans", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        period: "monthly",
        interval: 1,
        item: {
          name: "Invoicely Pro",
          amount: 19900, // ₹199 in paise
          currency: "INR",
          description: "Unlimited invoices, WhatsApp reminders, auto-reminders",
        },
      }),
    });

    if (!planResponse.ok) {
      return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
    }

    const plan = await planResponse.json();
    // In production, store plan.id as RAZORPAY_PLAN_ID env var
    return NextResponse.json({
      message: "Plan created. Set RAZORPAY_PLAN_ID env var to: " + plan.id,
      plan_id: plan.id,
    });
  }

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
      total_count: 12, // 12 months
      quantity: 1,
      notes: {
        user_id: user.id,
        email: user.email,
      },
    }),
  });

  if (!subscriptionResponse.ok) {
    const err = await subscriptionResponse.json();
    return NextResponse.json({ error: err.error?.description || "Failed to create subscription" }, { status: 500 });
  }

  const subscription = await subscriptionResponse.json();

  return NextResponse.json({
    subscription_id: subscription.id,
    razorpay_key: process.env.RAZORPAY_KEY_ID,
    subscription_url: subscription.short_url,
  });
}
