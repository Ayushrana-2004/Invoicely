"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle, Download } from "lucide-react";
import type { InvoiceStatus } from "@/types/database";

interface InvoiceActionsProps {
  invoiceId: string;
  status: InvoiceStatus;
}

export function InvoiceActions({ invoiceId, status }: InvoiceActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const updateStatus = async (newStatus: InvoiceStatus) => {
    setLoading(newStatus);
    const supabase = createClient();

    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "paid") {
      updates.paid_at = new Date().toISOString();
    }

    await supabase.from("invoices").update(updates).eq("id", invoiceId);

    setLoading(null);
    router.refresh();
  };

  const handleDownloadPDF = async () => {
    setLoading("download");
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Failed to download PDF:", err);
    }
    setLoading(null);
  };

  return (
    <div className="flex items-center gap-2">
      {status === "draft" && (
        <Button
          size="sm"
          onClick={() => updateStatus("sent")}
          loading={loading === "sent"}
        >
          <Send className="h-4 w-4 mr-1" />
          Mark as Sent
        </Button>
      )}

      {(status === "sent" || status === "overdue") && (
        <Button
          size="sm"
          onClick={() => updateStatus("paid")}
          loading={loading === "paid"}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Mark Paid
        </Button>
      )}

      <Button
        size="sm"
        variant="outline"
        onClick={handleDownloadPDF}
        loading={loading === "download"}
      >
        <Download className="h-4 w-4 mr-1" />
        PDF
      </Button>
    </div>
  );
}
