export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  business_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gst_number: string | null;
  pan_number: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gst_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  items: InvoiceItem[];
  client?: Client;
  reminders_sent: number;
  last_reminder_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  invoice_id: string;
  user_id: string;
  type: "email" | "whatsapp";
  status: "pending" | "sent" | "failed";
  sent_at: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_revenue: number;
  pending_amount: number;
  overdue_amount: number;
  total_invoices: number;
  paid_invoices: number;
  overdue_invoices: number;
}
