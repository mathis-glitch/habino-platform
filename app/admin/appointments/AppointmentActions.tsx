"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AppointmentActions({ id, status }: { id: string; status: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function update(newStatus: string) {
    setLoading(true);
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
    setLoading(false);
  }

  if (status === "confirmed") {
    return (
      <button onClick={() => update("cancelled")} disabled={loading}
        className="text-xs text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50">
        Absagen
      </button>
    );
  }
  if (status === "cancelled") {
    return <span className="text-xs text-slate-300">Abgesagt</span>;
  }
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => update("confirmed")} disabled={loading}
        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50">
        Bestätigen
      </button>
      <button onClick={() => update("cancelled")} disabled={loading}
        className="text-xs text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50">
        Absagen
      </button>
    </div>
  );
}
