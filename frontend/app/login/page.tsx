"use client"
import Link from "next/link"

export default function LoginPage() {
  // Use a same-origin URL so the Vercel rewrite proxies /auth/login to
  // Railway, keeping the session cookie on networkify.live.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ""

  return (
    <div className="min-h-screen bg-[#0a0a12] relative overflow-hidden flex items-center justify-center">
      {/* Cosmic background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#0a0a12_70%)]" />

        {/* Main glow ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]">
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-brand-600/40 via-purple-500/20 to-transparent blur-[80px] animate-pulse-slow" />
          <div className="absolute inset-12 rounded-full border border-purple-500/20 animate-[spin_60s_linear_infinite]" />
          <div className="absolute inset-24 rounded-full border border-brand-500/10 animate-[spin_45s_linear_infinite_reverse]" />
        </div>

        {/* Particle dots */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white/30 rounded-full animate-pulse"
            style={{
              top: `${(i * 37 + 11) % 100}%`,
              left: `${(i * 53 + 7) % 100}%`,
              animationDelay: `${(i * 0.3) % 3}s`,
              animationDuration: `${2 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-8 group">
            <img src="/logo.png" alt="Networkify" className="w-12 h-12 object-contain" />
            <span className="text-xl font-semibold text-white tracking-tight">Networkify</span>
          </Link>

          <h1 className="text-3xl font-bold text-white mb-3">Welcome</h1>
          <p className="text-zinc-500 text-sm">Sign in to explore your professional network</p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#12121a]/80 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8">
          <a
            href={`${apiUrl}/auth/login`}
            className="w-full flex items-center justify-center gap-3 btn-primary py-3.5 rounded-xl font-medium transition-all duration-200 active:scale-[0.98]"
          >
            Sign In
          </a>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-600">
          By signing in you agree to our{" "}
          <Link href="/terms" className="text-zinc-400 hover:text-white transition-colors">Terms</Link>
          {" & "}
          <Link href="/privacy" className="text-zinc-400 hover:text-white transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
