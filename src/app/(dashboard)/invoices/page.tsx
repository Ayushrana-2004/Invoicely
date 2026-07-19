import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, FileText, Search } from "lucide-react";
import Link from "next/link";
import type { InvoiceStatus } from "@/types/database";

export default async function InvoicesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, clients(name, email)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <Header title="Invoices" description="Create and manage your invoices">
        <Link href="/invoices/create">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Invoice
          </Button>
        </Link>
      </Header>

      {!invoices || invoices.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No invoices yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create your first invoice and start getting paid
          </p>
          <Link href="/invoices/create">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Create Invoice
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Invoice
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Client
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Amount
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Due Date
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Issued
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {(invoice.clients as { name: string })?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(invoice.clients as { email: string })?.email || ""}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(Number(invoice.total))}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={invoice.status as InvoiceStatus} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{formatDate(invoice.due_date)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{formatDate(invoice.issue_date)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
