import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// This endpoint is called by Vercel Cron to auto-send reminders for overdue invoices
// It uses the service role key to bypass RLS

export async function GET(request: Request) {
  // Verify cron secret (set in Vercel environment)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role to access all users' data
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find overdue invoices that haven't been reminded in the last 3 days
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const { data: overdueInvoices } = await supabase
    .from("invoices")
    .select("*, clients(name, email, phone), profiles(full_name, business_name)")
    .in("status", ["sent", "overdue"])
    .lt("due_date", new Date().toISOString().split("T")[0])
    .or(`last_reminder_at.is.null,last_reminder_at.lt.${threeDaysAgo.toISOString()}`);

  if (!overdueInvoices || overdueInvoices.length === 0) {
    return NextResponse.json({ message: "No overdue invoices to remind", count: 0 });
  }

  let sentCount = 0;

  for (const invoice of overdueInvoices) {
    // Update status to overdue if it was just "sent"
    if (invoice.status === "sent") {
      await supabase.from("invoices").update({ status: "overdue" }).eq("id", invoice.id);
    }

    // Log the reminder
    await supabase.from("reminders").insert({
      invoice_id: invoice.id,
      user_id: invoice.user_id,
      type: "email",
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    // Update reminder count
    await supabase
      .from("invoices")
      .update({
        reminders_sent: invoice.reminders_sent + 1,
        last_reminder_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);

    // Send email if Resend is configured
    if (process.env.RESEND_API_KEY) {
      const client = invoice.clients as { name: string; email: string };
      const profile = invoice.profiles as { full_name: string; business_name: string | null };
      const senderName = profile?.business_name || profile?.full_name || "Invoicely";
      const formattedTotal = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(Number(invoice.total));

      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${senderName} <invoices@resend.dev>`,
            to: [client.email],
            subject: `Overdue: Invoice ${invoice.invoice_number} - ${formattedTotal}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Payment Overdue</h2>
                <p>Hi ${client.name},</p>
                <p>Invoice <strong>${invoice.invoice_number}</strong> for <strong>${formattedTotal}</strong> is now overdue. Please process the payment as soon as possible.</p>
                <p>Thank you,<br/>${senderName}</p>
              </div>
            `,
          }),
        });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send reminder for invoice ${invoice.id}:`, err);
      }
    }
  }

  return NextResponse.json({
    message: `Processed ${overdueInvoices.length} overdue invoices, sent ${sentCount} reminders`,
    count: sentCount,
  });
}
