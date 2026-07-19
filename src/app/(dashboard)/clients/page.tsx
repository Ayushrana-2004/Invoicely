import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Mail, Phone, Building2 } from "lucide-react";
import Link from "next/link";

export const revalidate = 30; // Revalidate every 30 seconds

export default async function ClientsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <Header title="Clients" description="Manage your client directory">
        <Link href="/clients/create">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Client
          </Button>
        </Link>
      </Header>

      {!clients || clients.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No clients yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add your first client to start creating invoices
          </p>
          <Link href="/clients/create">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Add Client
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 font-semibold text-sm">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <h3 className="text-base font-semibold text-gray-900">{client.name}</h3>
              {client.business_name && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Building2 className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-sm text-gray-500">{client.business_name}</p>
                </div>
              )}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-sm text-gray-600">{client.email}</p>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-sm text-gray-600">{client.phone}</p>
                  </div>
                )}
              </div>
              {client.city && (
                <p className="text-xs text-gray-400 mt-3">
                  {client.city}{client.state ? `, ${client.state}` : ""}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
