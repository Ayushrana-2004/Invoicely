import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Bell, Mail, MessageSquare, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default async function RemindersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch reminders with invoice and client info
  const { data: reminders } = await supabase
    .from("reminders")
    .select("*, invoices(invoice_number, total, due_date, clients(name, email))")
    .eq("user_id", user.id)
    .order("sent_at", { ascending: false })
    .limit(50);

  // Fetch overdue invoices that could receive reminders
  const { data: overdueInvoices } = await supabase
    .from("invoices")
    .select("*, clients(name, email, phone)")
    .eq("user_id", user.id)
    .in("status", ["sent", "overdue"])
    .lt("due_date", new Date().toISOString().split("T")[0]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
        <p className="text-gray-500 mt-1">
          Track payment reminders sent to your clients
        </p>
      </div>

      {/* Overdue Invoices needing reminders */}
      {overdueInvoices && overdueInvoices.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-amber-900">
              {overdueInvoices.length} Overdue Invoice{overdueInvoices.length > 1 ? "s" : ""}
            </h2>
          </div>
          <p className="text-sm text-amber-700 mb-4">
            These invoices are past due. Automatic reminders are sent every 3 days for overdue invoices.
          </p>
          <div className="space-y-3">
            {overdueInvoices.map((invoice) => {
              const client = invoice.clients as { name: string; email: string; phone: string | null };
              const formattedTotal = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
              }).format(Number(invoice.total));

              return (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between bg-white rounded-lg border border-amber-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {invoice.invoice_number} — {client?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formattedTotal} · Due {new Date(invoice.due_date).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Bell className="h-3.5 w-3.5" />
                    {invoice.reminders_sent} sent
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reminder History */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Reminder History</h2>
        {!reminders || reminders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No reminders sent yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Reminders are automatically sent for overdue invoices, or you can send them manually from the invoice page.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => {
              const invoice = reminder.invoices as {
                invoice_number: string;
                total: number;
                due_date: string;
                clients: { name: string; email: string };
              };

              return (
                <div
                  key={reminder.id}
                  className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 px-5 py-4"
                >
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    {reminder.type === "whatsapp" ? (
                      <MessageSquare className="h-4.5 w-4.5 text-green-600" />
                    ) : (
                      <Mail className="h-4.5 w-4.5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {reminder.type === "whatsapp" ? "WhatsApp" : "Email"} reminder to{" "}
                      {invoice?.clients?.name || "Client"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      Invoice {invoice?.invoice_number} ·{" "}
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(Number(invoice?.total || 0))}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                    {reminder.sent_at
                      ? formatDistanceToNow(new Date(reminder.sent_at), { addSuffix: true })
                      : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
