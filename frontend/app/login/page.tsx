"use client"
import Link from "next/link"
import { Waypoints } from "lucide-react"

export default function LoginPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

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
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-8 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all">
              <Waypoints className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">Pathfinder</span>
          </Link>

          <h1 className="text-3xl font-bold text-white mb-3">Welcome back</h1>
          <p className="text-zinc-500 text-sm">
            Sign in to explore your professional network
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#12121a]/80 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8">
          <a
            id="sign-in-button"
            href={`${apiUrl}/auth/login`}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-900 font-medium 
                       px-6 py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-white/5"
          >
            {/* Lock icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Sign In
          </a>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600 uppercase tracking-wider">Secure Auth</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <p className="mt-4 text-xs text-zinc-600 text-center leading-relaxed">
            We only access your name, email, and profile picture.
            <br />
            Secured by Auth0.
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-zinc-600">
          By signing in you agree to our{" "}
          <span className="text-zinc-400 hover:text-white cursor-pointer transition-colors">Terms</span>
          {" & "}
          <span className="text-zinc-400 hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
        </p>
      </div>
    </div>
  )
}
