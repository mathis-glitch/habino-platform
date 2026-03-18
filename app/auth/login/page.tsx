"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTenant } from "@/app/tenant-provider";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function LoginPage() {
  const { tenant }     = useTenant();
  const router         = useRouter();
  const searchParams   = useSearchParams();
  const redirect       = searchParams.get("redirect") || "/";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setError("Sign in failed — no session returned. Please try again.");
      setLoading(false);
      return;
    }

    // Use window.location for a full page reload so middleware picks up the new session
    window.location.href = redirect;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-bold text-primary">
              {tenant?.name || "Habino"}
            </span>
          </Link>
          <p className="text-slate-500 mt-1 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm
                           focus:outline-none focus:ring-2 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm
                           focus:outline-none focus:ring-2 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 rounded-lg flex items-center justify-center gap-2"
            >
              {loading && <LoadingSpinner className="h-4 w-4" />}
              Sign in
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-primary font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
