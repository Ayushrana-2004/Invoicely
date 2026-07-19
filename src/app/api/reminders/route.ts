import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { invoice_id, type = "email" } = body;

  if (!invoice_id) {
    return NextResponse.json({ error: "invoice_id is required" }, { status: 400 });
  }

  // Verify invoice belongs to user
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, clients(name, email, phone)")
    .eq("id", invoice_id)
    .eq("user_id", user.id)
    .single();

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const client = invoice.clients as { name: string; email: string; phone: string | null };

  // Create reminder record
  const { error: reminderError } = await supabase.from("reminders").insert({
    invoice_id,
    user_id: user.id,
    type,
    status: "sent",
    sent_at: new Date().toISOString(),
  });

  if (reminderError) {
    return NextResponse.json({ error: reminderError.message }, { status: 500 });
  }

  // Update invoice reminder count
  await supabase
    .from("invoices")
    .update({
      reminders_sent: invoice.reminders_sent + 1,
      last_reminder_at: new Date().toISOString(),
    })
    .eq("id", invoice_id);

  // Send email reminder via Resend (if API key configured)
  if (type === "email" && process.env.RESEND_API_KEY) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, business_name")
        .eq("id", user.id)
        .single();

      const senderName = profile?.business_name || profile?.full_name || "Invoicely";
      const formattedTotal = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(Number(invoice.total));

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${senderName} <invoices@resend.dev>`,
          to: [client.email],
          subject: `Payment Reminder: Invoice ${invoice.invoice_number} - ${formattedTotal}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1f2937;">Payment Reminder</h2>
              <p style="color: #4b5563;">Hi ${client.name},</p>
              <p style="color: #4b5563;">
                This is a friendly reminder that invoice <strong>${invoice.invoice_number}</strong> 
                for <strong>${formattedTotal}</strong> is due for payment.
              </p>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Invoice: ${invoice.invoice_number}</p>
                <p style="margin: 4px 0 0; color: #1f2937; font-size: 18px; font-weight: bold;">${formattedTotal}</p>
                <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">Due: ${new Date(invoice.due_date).toLocaleDateString("en-IN")}</p>
              </div>
              <p style="color: #4b5563;">
                Please process the payment at your earliest convenience. If you have already made the payment, please disregard this reminder.
              </p>
              <p style="color: #4b5563;">Thank you,<br/>${senderName}</p>
            </div>
          `,
        }),
      });
    } catch (err) {
      console.error("Failed to send email:", err);
      // Don't fail the request if email fails — reminder is still logged
    }
  }

  // WhatsApp reminder (if configured)
  if (type === "whatsapp" && process.env.WHATSAPP_ACCESS_TOKEN && client.phone) {
    try {
      const formattedTotal = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(Number(invoice.total));

      // Using WhatsApp Business Cloud API
      await fetch(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: client.phone.replace(/[^0-9]/g, ""),
            type: "text",
            text: {
              body: `Hi ${client.name}! This is a reminder that invoice ${invoice.invoice_number} for ${formattedTotal} is due. Please process the payment at your earliest convenience. Thank you!`,
            },
          }),
        }
      );
    } catch (err) {
      console.error("Failed to send WhatsApp:", err);
    }
  }

  return NextResponse.json({ success: true, message: `${type} reminder sent` });
}
