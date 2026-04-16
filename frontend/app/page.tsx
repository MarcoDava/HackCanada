"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Network, Users, Home as HomeIcon, Upload, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/AuthContext"


export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuth()

  const userInitials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "?"


  return (
    <div className="min-h-screen bg-[#0a0a12] relative overflow-hidden">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>

        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 z-20 bg-gradient-to-b from-[#0a0a12]/60 via-transparent to-[#0a0a12]/80 pointer-events-none" />
        <div className="absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_#0a0a12_85%)] pointer-events-none" />
      </div>


      {/* Navigation */}
      <nav className="sticky top-0 z-50 px-8 py-6 bg-[#0a0a12]/80 backdrop-blur-md border-b border-zinc-800/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-xs tracking-[0.2em] text-zinc-500 uppercase">
            Networkify
          </div>

          {/* Right side: auth-aware */}
          {!isLoading && (
            isAuthenticated ? (
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-3 group"
                title={user?.name || user?.email || "Go to Dashboard"}
              >
                <span className="text-sm text-zinc-400 group-hover:text-white transition-colors hidden sm:inline">
                  Dashboard
                </span>
                <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-sm font-semibold text-white ring-2 ring-brand-500/30 group-hover:ring-brand-400/60 transition-all">
                  {userInitials}
                </div>
              </button>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2 rounded-full border border-zinc-700 text-sm text-white hover:bg-white/5 transition-all flex items-center gap-2"
              >
                Sign in
                <ArrowRight className="w-4 h-4" />
              </Link>
            )
          )}
        </div>
      </nav>


      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6">
        <div className="text-center max-w-4xl mx-auto">
          {/* Small label */}
          <div className="inline-flex items-center gap-2 text-xs tracking-[0.15em] text-purple-400/80 uppercase mb-8">
            <img src="/logo.png" alt="Networkify" className="w-4 h-4 object-contain" />
            <span>Networkify</span>
          </div>


          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-white leading-[1.1] mb-8 tracking-tight">
            <span className="text-[#c8b6ff]">Connections</span>
            <br />
            <span className="font-normal">Visualized</span>
            <br />
            <span className="font-small">and</span>
            <br />
            <span className="font-normal">Expanded</span>
          </h1>


          {/* Subtitle */}
          <p className="text-zinc-500 max-w-md mx-auto mb-12 leading-relaxed">
            Discover the warmest paths to any company with clarity and purpose.
          </p>
           
        </div>


        {/* Side labels — desktop only */}
        <div className="hidden md:block absolute left-8 bottom-32 max-w-[200px]">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Career_Intelligence</p>
          <h3 className="text-lg font-medium text-white mb-4 leading-snug">
            Managing Networking Reinvented
          </h3>
          <Link
            href={isAuthenticated ? "/dashboard" : "/login"}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            <Network className="w-3.5 h-3.5" />
            Explore
          </Link>
        </div>

        <div className="hidden md:block absolute right-8 bottom-32 max-w-[250px] text-left">
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Networkify is a next-generation networking engine designed to navigate the complexity of professional relationships.
          </p>
        </div>

        {/* Bottom CTA */}
        <div className="flex items-center justify-center mt-4">
          <Link
            href={isAuthenticated ? "/dashboard" : "/login"}
            className="px-5 py-2.5 rounded-full bg-[#d4ff00] text-black text-sm font-medium hover:bg-[#e5ff4d] transition-all flex items-center gap-2"
          >
            {isAuthenticated ? "Go to Dashboard" : "Connect Now!"}
          </Link>
        </div>
      </main>


      {/* Bottom feature nav */}
      <div className="relative z-10 border-t border-zinc-800/50 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4 flex-wrap px-6">
          {[
            { icon: HomeIcon, label: "Dashboard", href: "/dashboard" },
            { icon: Upload, label: "Upload", href: "/upload" },
            { icon: Search, label: "Search", href: "/search" },
            { icon: Users, label: "Connections", href: "/connections" },
            { icon: Network, label: "Graph", href: "/graph" },
          ].map((item) => (
            <Link
              key={item.href}
              href={isAuthenticated ? item.href : "/login"}
              className="flex flex-col items-center gap-1.5 text-zinc-600 hover:text-zinc-300 transition-colors group px-3 py-2"
            >
              <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}




