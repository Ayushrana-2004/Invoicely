"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    business_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gst_number: "",
    pan_number: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          business_name: data.business_name || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
          gst_number: data.gst_number || "",
          pan_number: data.pan_number || "",
        });
      }
    };
    fetchProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        business_name: profile.business_name || null,
        phone: profile.phone || null,
        address: profile.address || null,
        city: profile.city || null,
        state: profile.state || null,
        pincode: profile.pincode || null,
        gst_number: profile.gst_number || null,
        pan_number: profile.pan_number || null,
      })
      .eq("id", user.id);

    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateField = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <Header title="Settings" description="Manage your business profile and preferences" />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Business Profile */}
        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Business Profile</h3>
          <p className="text-sm text-gray-500 mb-4">
            This information appears on your invoices
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="full_name"
              label="Full Name *"
              value={profile.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
              required
            />
            <Input
              id="business_name"
              label="Business Name"
              placeholder="Your Company Name"
              value={profile.business_name}
              onChange={(e) => updateField("business_name", e.target.value)}
            />
            <Input
              id="phone"
              label="Phone"
              placeholder="+91 9876543210"
              value={profile.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>
        </Card>

        {/* Address */}
        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Business Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                id="address"
                label="Street Address"
                placeholder="123 Main Street, Floor 2"
                value={profile.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </div>
            <Input
              id="city"
              label="City"
              placeholder="Mumbai"
              value={profile.city}
              onChange={(e) => updateField("city", e.target.value)}
            />
            <Input
              id="state"
              label="State"
              placeholder="Maharashtra"
              value={profile.state}
              onChange={(e) => updateField("state", e.target.value)}
            />
            <Input
              id="pincode"
              label="Pincode"
              placeholder="400001"
              value={profile.pincode}
              onChange={(e) => updateField("pincode", e.target.value)}
            />
          </div>
        </Card>

        {/* Tax Info */}
        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Tax Information</h3>
          <p className="text-sm text-gray-500 mb-4">
            GST and PAN details for compliant invoicing
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="gst_number"
              label="GST Number"
              placeholder="22AAAAA0000A1Z5"
              value={profile.gst_number}
              onChange={(e) => updateField("gst_number", e.target.value)}
            />
            <Input
              id="pan_number"
              label="PAN Number"
              placeholder="AAAAA0000A"
              value={profile.pan_number}
              onChange={(e) => updateField("pan_number", e.target.value)}
            />
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={loading}>
            Save Settings
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Saved successfully
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
