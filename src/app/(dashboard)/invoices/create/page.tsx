"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateInvoiceNumber } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import type { Client } from "@/types/database";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [invoiceNumber] = useState(generateInvoiceNumber());
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState(18);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, rate: 0, amount: 0 },
  ]);

  useEffect(() => {
    // Set default due date to 15 days from now
    const due = new Date();
    due.setDate(due.getDate() + 15);
    setDueDate(due.toISOString().split("T")[0]);

    // Fetch clients
    const fetchClients = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("clients")
        .select("*")
        .order("name", { ascending: true });
      if (data) setClients(data as Client[]);
    };
    fetchClients();
  }, []);

  const addItem = () => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), description: "", quantity: 1, rate: 0, amount: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        updated.amount = Number(updated.quantity) * Number(updated.rate);
        return updated;
      })
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!selectedClient) {
      setError("Please select a client");
      setLoading(false);
      return;
    }

    if (items.some((item) => !item.description || item.rate <= 0)) {
      setError("Please fill in all line items with valid amounts");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        user_id: user.id,
        client_id: selectedClient,
        invoice_number: invoiceNumber,
        status: "draft",
        issue_date: issueDate,
        due_date: dueDate,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        notes: notes || null,
      })
      .select()
      .single();

    if (invoiceError) {
      setError(invoiceError.message);
      setLoading(false);
      return;
    }

    // Create invoice items
    const { error: itemsError } = await supabase.from("invoice_items").insert(
      items.map((item) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      }))
    );

    if (itemsError) {
      setError(itemsError.message);
      setLoading(false);
      return;
    }

    router.push(`/invoices/${invoice.id}`);
    router.refresh();
  };

  return (
    <div>
      <Header title="Create Invoice" description="Fill in the details to generate a new invoice" />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Invoice Details */}
        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Invoice Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              id="invoice_number"
              label="Invoice Number"
              value={invoiceNumber}
              readOnly
              className="bg-gray-50"
            />
            <div className="w-full">
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
                Client *
              </label>
              <select
                id="client"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.business_name ? `(${client.business_name})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <Input
              id="issue_date"
              label="Issue Date"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
            />
            <Input
              id="due_date"
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
        </Card>

        {/* Line Items */}
        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Line Items</h3>
          <div className="space-y-3">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-3 text-xs font-medium text-gray-500 uppercase tracking-wider px-1">
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Rate (₹)</div>
              <div className="col-span-2">Amount (₹)</div>
              <div className="col-span-1"></div>
            </div>

            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-3 items-start">
                <div className="col-span-12 md:col-span-5">
                  <input
                    type="text"
                    placeholder="Service description"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    placeholder="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={item.rate || ""}
                    onChange={(e) => updateItem(item.id, "rate", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <input
                    type="text"
                    value={item.amount.toFixed(2)}
                    readOnly
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                  />
                </div>
                <div className="col-span-1">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-500 font-medium mt-2"
            >
              <Plus className="h-4 w-4" />
              Add Line Item
            </button>
          </div>

          {/* Totals */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex flex-col items-end space-y-2">
              <div className="flex items-center gap-8 text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900 font-medium w-28 text-right">
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">Tax</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center"
                />
                <span className="text-gray-500">%</span>
                <span className="text-gray-900 font-medium w-28 text-right">
                  ₹{taxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-8 text-base border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-900 font-semibold">Total</span>
                <span className="text-gray-900 font-bold w-28 text-right">
                  ₹{total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card>
          <Textarea
            id="notes"
            label="Notes (optional)"
            placeholder="Payment terms, bank details, or any additional information..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Card>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={loading}>
            Create Invoice
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
