import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Create a one-time Razorpay order for Pro upgrade
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

  const authHeader = `Basic ${Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64")}`;

  try {
    // Create a one-time order for ₹399
    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 39900, // ₹399 in paise
        currency: "INR",
        receipt: `pro_${user.id.slice(0, 8)}_${Date.now()}`,
        notes: {
          user_id: user.id,
          email: user.email,
          plan: "pro",
        },
      }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error("Razorpay order error:", JSON.stringify(orderData));
      return NextResponse.json(
        { error: orderData.error?.description || "Failed to create order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      order_id: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      razorpay_key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: String(err) },
      { status: 500 }
    );
  }
}
