"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTenant } from "@/app/tenant-provider";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function RegisterPage() {
  const { tenant } = useTenant();
  const router     = useRouter();

  const [fullName,  setFullName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          tenant_id: tenant?.id ?? null,
          role: "operator_admin",
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md card p-8 text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Check your email</h2>
          <p className="text-slate-500 text-sm mb-6">
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account.
          </p>
          <Link href="/auth/login" className="btn-primary w-full block py-2.5 text-center rounded-lg">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-bold text-primary">
              {tenant?.name || "Habino"}
            </span>
          </Link>
          <p className="text-slate-500 mt-1 text-sm">Create your account</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
              <input
                type="text" required value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2"
                placeholder="Jane Mwangi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password" required minLength={8} value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2"
                placeholder="Min. 8 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
              <input
                type="password" required value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2"
                placeholder="Repeat password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 rounded-lg flex items-center justify-center gap-2"
            >
              {loading && <LoadingSpinner className="h-4 w-4" />}
              Create account
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
