"use client"
import Link from "next/link"
import { Waypoints } from "lucide-react"

export default function LoginPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL

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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all">
              <Waypoints className="w-6 h-6 text-white" />
            </div>
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
            Continue with Auth0
          </a>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#12121a] px-2 text-zinc-600">Or continue with</span>
            </div>
          </div>

          <a
            href={`${apiUrl}/auth/login`}
            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white font-medium
                       px-6 py-3.5 rounded-xl border border-white/10 transition-all duration-200 active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 2.47 2.18 4.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </a>
        </div>

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
