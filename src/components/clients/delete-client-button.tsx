"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const supabase = createClient();

    const { error } = await supabase.from("clients").delete().eq("id", clientId);

    if (error) {
      alert(error.message);
      setDeleting(false);
      setConfirming(false);
      return;
    }

    router.refresh();
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="text-xs font-medium text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title={`Delete ${clientName}`}
      className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
