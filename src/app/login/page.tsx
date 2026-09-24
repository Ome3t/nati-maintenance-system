"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Wrench, BarChart3, Users, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error.toLowerCase().includes("disabled")
            ? result.error
            : "Invalid email or password"
        );
        setLoading(false);
        return;
      }

      // Redirect to root — the role-based router in page.tsx handles everything
      router.push("/");
      router.refresh();
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const features = [
    { Icon: Wrench, title: "Track repairs in real time", desc: "From intake to delivery" },
    { Icon: BarChart3, title: "Live business insights", desc: "Sales, jobs, revenue — updated live" },
    { Icon: Users, title: "Built for your team", desc: "Owner, cashier & technician roles" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* ---------- Left branding panel (desktop) — deep, muted emerald ---------- */}
      <div className="relative hidden lg:flex w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 p-12">
        {/* soft glow accents (subtle now) */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-950/40">
            <Wrench className="h-5 w-5 text-emerald-50" />
          </div>
          <span className="text-2xl font-bold text-white">
            Nati<span className="text-emerald-400">.</span>
          </span>
        </div>

        {/* Headline + features */}
        <div className="relative space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight text-white">
              Repair shop management made simple.
            </h1>
            <p className="text-lg text-emerald-100/70">
              Track every device, every payment, and every repair — all in one place.
            </p>
          </div>

          <div className="space-y-6">
            {features.map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-400/15">
                  <Icon className="h-4 w-4 text-emerald-400/90" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-sm text-emerald-100/60">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer badge */}
        <div className="relative flex items-center gap-2 text-sm text-emerald-100/50">
          <ShieldCheck className="h-4 w-4" />
          <span>Secure • Fast • Reliable</span>
        </div>
      </div>

      {/* ---------- Right form panel ---------- */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-page-enter">
          {/* Mobile-only logo */}
          <div className="mb-10 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">
              Nati<span className="text-primary">.</span>
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm animate-page-enter">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@natimaintenance.com"
                required
                className="w-full px-4 py-3 bg-muted/40 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/40 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 pr-12 bg-muted/40 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            © 2026 Nati Maintenance. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}