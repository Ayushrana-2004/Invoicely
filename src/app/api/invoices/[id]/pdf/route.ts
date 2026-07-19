import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

// Format currency without the ₹ symbol (jsPDF can't render it properly)
// We'll add "INR" or "Rs." prefix instead
function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch invoice with client and items
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, clients(*), invoice_items(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

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
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];

  // Generate PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // ─── HEADER ────────────────────────────────────────────
  // Blue header bar
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageWidth, 40, "F");

  // Invoice title on the blue bar
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("INVOICE", margin, 25);

  // Invoice number below title
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 220, 255);
  doc.text(invoice.invoice_number, margin, 33);

  // Status on the right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(invoice.status.toUpperCase(), pageWidth - margin, 25, { align: "right" });

  // ─── FROM / BILL TO ────────────────────────────────────
  const sectionStartY = 55;

  // FROM
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(140, 140, 140);
  doc.text("FROM", margin, sectionStartY);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  let fromY = sectionStartY + 7;
  doc.text(profile?.business_name || profile?.full_name || user.email || "", margin, fromY);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  if (profile?.phone) {
    fromY += 6;
    doc.text(profile.phone, margin, fromY);
  }
  if (profile?.address) {
    fromY += 5;
    doc.text(profile.address, margin, fromY);
  }
  if (profile?.city) {
    fromY += 5;
    const cityLine = `${profile.city}${profile.state ? `, ${profile.state}` : ""}${profile.pincode ? ` - ${profile.pincode}` : ""}`;
    doc.text(cityLine, margin, fromY);
  }
  if (profile?.gst_number) {
    fromY += 6;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text(`GSTIN: ${profile.gst_number}`, margin, fromY);
  }

  // BILL TO
  const billToX = pageWidth / 2 + 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(140, 140, 140);
  doc.text("BILL TO", billToX, sectionStartY);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  let toY = sectionStartY + 7;
  doc.text(client.name, billToX, toY);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  if (client.business_name) {
    toY += 6;
    doc.text(client.business_name, billToX, toY);
  }
  toY += 5;
  doc.text(client.email, billToX, toY);
  if (client.phone) {
    toY += 5;
    doc.text(client.phone, billToX, toY);
  }
  if (client.address) {
    toY += 5;
    doc.text(client.address, billToX, toY);
  }
  if (client.city) {
    toY += 5;
    const cityLine = `${client.city}${client.state ? `, ${client.state}` : ""}${client.pincode ? ` - ${client.pincode}` : ""}`;
    doc.text(cityLine, billToX, toY);
  }
  if (client.gst_number) {
    toY += 6;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text(`GSTIN: ${client.gst_number}`, billToX, toY);
  }

  // ─── DATES BAR ─────────────────────────────────────────
  const datesY = Math.max(fromY, toY) + 15;

  // Light gray background for dates
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, datesY - 5, contentWidth, 16, 2, 2, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(120, 120, 120);
  doc.text("ISSUE DATE", margin + 8, datesY + 1);
  doc.text("DUE DATE", pageWidth / 2 - 10, datesY + 1);
  doc.text("CURRENCY", pageWidth - margin - 35, datesY + 1);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.text(formatDate(invoice.issue_date), margin + 8, datesY + 7);
  doc.text(formatDate(invoice.due_date), pageWidth / 2 - 10, datesY + 7);
  doc.text("INR", pageWidth - margin - 35, datesY + 7);

  // ─── LINE ITEMS TABLE ──────────────────────────────────
  const tableStartY = datesY + 22;

  autoTable(doc, {
    startY: tableStartY,
    head: [["#", "Description", "Qty", "Rate (Rs.)", "Amount (Rs.)"]],
    body: items.map((item, index) => [
      (index + 1).toString(),
      item.description,
      item.quantity.toString(),
      formatAmount(Number(item.rate)),
      formatAmount(Number(item.amount)),
    ]),
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [40, 40, 40],
      cellPadding: 4,
      lineColor: [230, 230, 230],
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 32, halign: "right" },
      4: { cellWidth: 35, halign: "right" },
    },
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: {
      overflow: "linebreak",
    },
  });

  // ─── TOTALS ────────────────────────────────────────────
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  const totalsX = pageWidth - margin - 70;
  const totalsValueX = pageWidth - margin;

  // Subtotal
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Subtotal", totalsX, finalY);
  doc.setTextColor(40, 40, 40);
  doc.text(`Rs. ${formatAmount(Number(invoice.subtotal))}`, totalsValueX, finalY, { align: "right" });

  // Tax
  doc.setTextColor(100, 100, 100);
  doc.text(`GST (${invoice.tax_rate}%)`, totalsX, finalY + 8);
  doc.setTextColor(40, 40, 40);
  doc.text(`Rs. ${formatAmount(Number(invoice.tax_amount))}`, totalsValueX, finalY + 8, { align: "right" });

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(totalsX, finalY + 13, totalsValueX, finalY + 13);

  // Total with background
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(totalsX - 5, finalY + 16, totalsValueX - totalsX + 10, 12, 2, 2, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL", totalsX, finalY + 24);
  doc.text(`Rs. ${formatAmount(Number(invoice.total))}`, totalsValueX, finalY + 24, { align: "right" });

  // ─── NOTES ─────────────────────────────────────────────
  if (invoice.notes) {
    const notesY = finalY + 40;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(140, 140, 140);
    doc.text("NOTES / PAYMENT TERMS", margin, notesY);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(invoice.notes, margin, notesY + 7, { maxWidth: contentWidth });
  }

  // ─── FOOTER ────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text("Generated by Invoicely", margin, footerY);
  doc.text(`Page 1 of 1`, pageWidth - margin, footerY, { align: "right" });

  // Output
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
    },
  });
}
