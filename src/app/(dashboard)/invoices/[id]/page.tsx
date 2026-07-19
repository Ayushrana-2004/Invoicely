import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getDaysOverdue } from "@/lib/utils";
import { CheckCircle, AlertTriangle, FileText } from "lucide-react";
import type { InvoiceStatus } from "@/types/database";
import { InvoiceActions } from "@/components/invoices/invoice-actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, clients(*), invoice_items(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!invoice) notFound();

  const client = invoice.clients as {
    name: string;
    email: string;
    phone: string | null;
    business_name: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    gst_number: string | null;
  };

  const items = (invoice.invoice_items || []) as {
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];

  // Fetch profile for "from" info
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const daysOverdue = getDaysOverdue(invoice.due_date);

  return (
    <div>
      <Header title={`Invoice ${invoice.invoice_number}`}>
        <InvoiceActions invoiceId={invoice.id} status={invoice.status as InvoiceStatus} />
      </Header>

      {/* Status Banner */}
      {invoice.status === "overdue" && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              This invoice is {daysOverdue} days overdue
            </p>
            <p className="text-xs text-red-600">
              Due date was {formatDate(invoice.due_date)}
            </p>
          </div>
        </div>
      )}

      {invoice.status === "paid" && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Payment received</p>
            {invoice.paid_at && (
              <p className="text-xs text-green-600">Paid on {formatDate(invoice.paid_at)}</p>
            )}
          </div>
        </div>
      )}

      {/* Invoice Preview */}
      <Card className="max-w-4xl overflow-hidden p-0">
        {/* Blue Header */}
        <div className="bg-blue-600 px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">INVOICE</h2>
              <p className="text-blue-200 text-sm mt-1">{invoice.invoice_number}</p>
            </div>
            <Badge status={invoice.status as InvoiceStatus} className="text-sm bg-white/20 text-white" />
          </div>
        </div>

        <div className="p-8">
          {/* From / To Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                From
              </p>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900">
                  {profile?.business_name || profile?.full_name || user.email}
                </p>
                {profile?.phone && (
                  <p className="text-sm text-gray-600">{profile.phone}</p>
                )}
                {profile?.address && (
                  <p className="text-sm text-gray-600">{profile.address}</p>
                )}
                {profile?.city && (
                  <p className="text-sm text-gray-600">
                    {profile.city}{profile.state ? `, ${profile.state}` : ""}{profile.pincode ? ` - ${profile.pincode}` : ""}
                  </p>
                )}
                {profile?.gst_number && (
                  <p className="text-sm text-gray-600 mt-2 font-medium">
                    GSTIN: {profile.gst_number}
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Bill To
              </p>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900">{client.name}</p>
                {client.business_name && (
                  <p className="text-sm text-gray-600">{client.business_name}</p>
                )}
                <p className="text-sm text-gray-600">{client.email}</p>
                {client.phone && (
                  <p className="text-sm text-gray-600">{client.phone}</p>
                )}
                {client.address && (
                  <p className="text-sm text-gray-600">{client.address}</p>
                )}
                {client.city && (
                  <p className="text-sm text-gray-600">
                    {client.city}{client.state ? `, ${client.state}` : ""}{client.pincode ? ` - ${client.pincode}` : ""}
                  </p>
                )}
                {client.gst_number && (
                  <p className="text-sm text-gray-600 mt-2 font-medium">
                    GSTIN: {client.gst_number}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Issue Date</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(invoice.issue_date)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Due Date</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(invoice.due_date)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Reminders</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{invoice.reminders_sent} sent</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</p>
              <div className="mt-1">
                <Badge status={invoice.status as InvoiceStatus} />
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-8">
                    #
                  </th>
                  <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                    Description
                  </th>
                  <th className="text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-16">
                    Qty
                  </th>
                  <th className="text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-28">
                    Rate
                  </th>
                  <th className="text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-32">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm text-gray-400">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {formatCurrency(Number(item.rate))}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(Number(item.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72">
              <div className="space-y-2 pb-3 border-b border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(Number(invoice.subtotal))}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">GST ({invoice.tax_rate}%)</span>
                  <span className="text-gray-900">{formatCurrency(Number(invoice.tax_amount))}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(Number(invoice.total))}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Notes / Payment Terms
              </p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Generated by Invoicely
          </p>
        </div>
      </Card>
    </div>
  );
}
