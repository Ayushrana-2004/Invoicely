import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getDaysOverdue } from "@/lib/utils";
import {
  IndianRupee,
  Clock,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import type { InvoiceStatus } from "@/types/database";

export const revalidate = 30; // Revalidate every 30 seconds

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch dashboard stats
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, clients(name, email)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const allInvoices = invoices || [];

  // Calculate stats
  const totalRevenue = allInvoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  const pendingAmount = allInvoices
    .filter((inv) => inv.status === "sent")
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  const overdueAmount = allInvoices
    .filter((inv) => inv.status === "overdue")
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  const totalInvoices = allInvoices.length;
  const paidInvoices = allInvoices.filter((inv) => inv.status === "paid").length;
  const overdueInvoices = allInvoices.filter((inv) => inv.status === "overdue").length;

  // Recent invoices (last 5)
  const recentInvoices = allInvoices.slice(0, 5);

  // Overdue invoices
  const overdueList = allInvoices
    .filter((inv) => inv.status === "overdue" || (inv.status === "sent" && new Date(inv.due_date) < new Date()))
    .slice(0, 5);

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: IndianRupee,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Pending Amount",
      value: formatCurrency(pendingAmount),
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Overdue Amount",
      value: formatCurrency(overdueAmount),
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Invoices Paid",
      value: `${paidInvoices}/${totalInvoices}`,
      icon: CheckCircle2,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div>
      <Header title="Dashboard" description="Overview of your invoicing activity">
        <Link href="/invoices/create">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Invoice
          </Button>
        </Link>
      </Header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
              <Link href="/invoices" className="text-sm text-blue-600 hover:text-blue-500 flex items-center gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {recentInvoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No invoices yet</p>
                <Link href="/invoices/create" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-500">
                  Create your first invoice
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {(invoice.clients as { name: string })?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">{invoice.invoice_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(Number(invoice.total))}
                      </p>
                      <Badge status={invoice.status as InvoiceStatus} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Overdue Alerts */}
        <div>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900">Overdue</h2>
            </div>

            {overdueList.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No overdue invoices!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueList.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="block p-3 rounded-lg border border-red-100 bg-red-50/50 hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {(invoice.clients as { name: string })?.name || "Unknown"}
                      </p>
                      <p className="text-sm font-bold text-red-600">
                        {formatCurrency(Number(invoice.total))}
                      </p>
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      {getDaysOverdue(invoice.due_date)} days overdue
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
