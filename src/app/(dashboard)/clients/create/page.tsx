"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CreateClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: insertError } = await supabase.from("clients").insert({
      user_id: user.id,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: (formData.get("phone") as string) || null,
      business_name: (formData.get("business_name") as string) || null,
      address: (formData.get("address") as string) || null,
      city: (formData.get("city") as string) || null,
      state: (formData.get("state") as string) || null,
      pincode: (formData.get("pincode") as string) || null,
      gst_number: (formData.get("gst_number") as string) || null,
      notes: (formData.get("notes") as string) || null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/clients");
    router.refresh();
  };

  return (
    <div>
      <Header title="Add Client" description="Add a new client to your directory" />

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="name"
                name="name"
                label="Client Name *"
                placeholder="John Doe"
                required
              />
              <Input
                id="email"
                name="email"
                label="Email *"
                type="email"
                placeholder="client@example.com"
                required
              />
              <Input
                id="phone"
                name="phone"
                label="Phone"
                placeholder="+91 9876543210"
              />
              <Input
                id="business_name"
                name="business_name"
                label="Business Name"
                placeholder="Acme Corp"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  id="address"
                  name="address"
                  label="Street Address"
                  placeholder="123 Main Street"
                />
              </div>
              <Input id="city" name="city" label="City" placeholder="Mumbai" />
              <Input id="state" name="state" label="State" placeholder="Maharashtra" />
              <Input id="pincode" name="pincode" label="Pincode" placeholder="400001" />
              <Input
                id="gst_number"
                name="gst_number"
                label="GST Number"
                placeholder="22AAAAA0000A1Z5"
              />
            </div>
          </div>

          {/* Notes */}
          <Textarea
            id="notes"
            name="notes"
            label="Notes"
            placeholder="Any additional notes about this client..."
          />

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" loading={loading}>
              Add Client
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
