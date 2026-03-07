"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Waypoints, Network, TrendingUp, Users, Zap } from "lucide-react"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/AuthContext"

const DemoGraph3D = dynamic(() => import("@/components/graph/DemoGraph3D"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#0a0a12]" />
})


export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuth()
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [mounted, setMounted] = useState(false)

  const userInitials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "?"

  useEffect(() => {
    setMounted(true)
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a12] relative overflow-hidden">
      {/* 3D Graph Background */}
      <div className="fixed inset-0 z-0">
        {mounted && dimensions.width > 0 && (
          <DemoGraph3D width={dimensions.width} height={dimensions.height} />
        )}
        
        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a12]/60 via-transparent to-[#0a0a12]/80 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_#0a0a12_85%)] pointer-events-none" />
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
            <Waypoints className="w-3.5 h-3.5" />
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


        {/* Side labels */}
        <div className="absolute left-8 bottom-32 max-w-[200px]">
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


        <div className="absolute right-8 bottom-32 max-w-[250px] text-left">
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Pathfinder is a next-generation networking engine designed to navigate the complexity of professional relationships.
          </p>
        </div>


        {/* Bottom CTA */}
        <div className=" flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <div className="w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center">
              <Waypoints className="w-3 h-3" />
            </div>
            
            <span className="text-zinc-700">=</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link
            href={isAuthenticated ? "/dashboard" : "/login"}
            className="px-5 py-2.5 rounded-full bg-[#d4ff00] text-black text-sm font-medium hover:bg-[#e5ff4d] transition-all flex items-center gap-2"
          >
            {isAuthenticated ? "Go to Dashboard" : "Connect Now!"}
          </Link>
          </div>
        </div>
      </main>


      {/* Bottom tech icons */}
      <div className="relative z-10 border-t border-zinc-800/50 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-12">
          {[
            { icon: Network, label: "Neo4j" },
            { icon: Zap, label: "Gemini" },
            { icon: TrendingUp, label: "FastAPI" },
            { icon: Users, label: "LinkedIn" },
            { icon: Waypoints, label: "Cloudinary" },
          ].map((tech, i) => (
            <div key={i} className="flex flex-col items-center gap-2 text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer">
              <tech.icon className="w-5 h-5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}




