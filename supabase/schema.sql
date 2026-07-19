-- Invoicely Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  business_name text,
  phone text,
  address text,
  city text,
  state text,
  pincode text,
  gst_number text,
  pan_number text,
  logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Clients table
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  email text not null,
  phone text,
  business_name text,
  address text,
  city text,
  state text,
  pincode text,
  gst_number text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Invoices table
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete restrict not null,
  invoice_number text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date date not null default current_date,
  due_date date not null,
  subtotal numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 18,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  reminders_sent integer not null default 0,
  last_reminder_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Invoice items table
create table public.invoice_items (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  rate numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0
);

-- Reminders table (log of sent reminders)
create table public.reminders (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('email', 'whatsapp')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- Row Level Security (RLS) Policies
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.reminders enable row level security;

-- Profiles: users can only access their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Clients: users can only access their own clients
create policy "Users can view own clients" on public.clients
  for select using (auth.uid() = user_id);
create policy "Users can insert own clients" on public.clients
  for insert with check (auth.uid() = user_id);
create policy "Users can update own clients" on public.clients
  for update using (auth.uid() = user_id);
create policy "Users can delete own clients" on public.clients
  for delete using (auth.uid() = user_id);

-- Invoices: users can only access their own invoices
create policy "Users can view own invoices" on public.invoices
  for select using (auth.uid() = user_id);
create policy "Users can insert own invoices" on public.invoices
  for insert with check (auth.uid() = user_id);
create policy "Users can update own invoices" on public.invoices
  for update using (auth.uid() = user_id);
create policy "Users can delete own invoices" on public.invoices
  for delete using (auth.uid() = user_id);

-- Invoice Items: access through invoice ownership
create policy "Users can view own invoice items" on public.invoice_items
  for select using (
    exists (select 1 from public.invoices where id = invoice_id and user_id = auth.uid())
  );
create policy "Users can insert own invoice items" on public.invoice_items
  for insert with check (
    exists (select 1 from public.invoices where id = invoice_id and user_id = auth.uid())
  );
create policy "Users can update own invoice items" on public.invoice_items
  for update using (
    exists (select 1 from public.invoices where id = invoice_id and user_id = auth.uid())
  );
create policy "Users can delete own invoice items" on public.invoice_items
  for delete using (
    exists (select 1 from public.invoices where id = invoice_id and user_id = auth.uid())
  );

-- Reminders: users can only access their own reminders
create policy "Users can view own reminders" on public.reminders
  for select using (auth.uid() = user_id);
create policy "Users can insert own reminders" on public.reminders
  for insert with check (auth.uid() = user_id);

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auto-creating profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at();
create trigger clients_updated_at before update on public.clients
  for each row execute procedure public.update_updated_at();
create trigger invoices_updated_at before update on public.invoices
  for each row execute procedure public.update_updated_at();

-- Indexes for performance
create index idx_clients_user_id on public.clients(user_id);
create index idx_invoices_user_id on public.invoices(user_id);
create index idx_invoices_client_id on public.invoices(client_id);
create index idx_invoices_status on public.invoices(status);
create index idx_invoices_due_date on public.invoices(due_date);
create index idx_invoice_items_invoice_id on public.invoice_items(invoice_id);
create index idx_reminders_invoice_id on public.reminders(invoice_id);
