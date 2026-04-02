"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Waypoints, ArrowLeft, ZoomIn, ZoomOut, Maximize2, Minimize2, Eye, EyeOff } from "lucide-react"
import Sidebar from "@/components/Sidebar"
import Graph from "@/components/graph/Graph"

export default function GraphPage() {
  const router = useRouter()
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [initialZoom, setInitialZoom] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isUIHidden, setIsUIHidden] = useState(false)

  const updateDimensions = useCallback((fullscreen: boolean) => {
    if (fullscreen) {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    } else {
      setDimensions({
        width: window.innerWidth - 80 - 48,
        height: window.innerHeight - 140,
      })
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => {
      const newState = !prev
      updateDimensions(newState)
      return newState
    })
  }, [updateDimensions])

  const exitFullscreen = useCallback(() => {
    if (isFullscreen) {
      setIsFullscreen(false)
      setIsUIHidden(false)
      updateDimensions(false)
    }
  }, [isFullscreen, updateDimensions])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get("zoom") === "true") {
        setInitialZoom(true)
      }
    }

    function handleResize() {
      updateDimensions(isFullscreen)
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        exitFullscreen()
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isFullscreen, updateDimensions, exitFullscreen])

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-dark-bg">
        <Graph width={dimensions.width} height={dimensions.height} initialZoom={initialZoom} />

        {/* Fullscreen Controls - Always visible */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {isUIHidden && (
            <button
              onClick={() => setIsUIHidden(false)}
              className="w-10 h-10 rounded-xl bg-dark-surface/90 backdrop-blur-sm border border-dark-glassBorder flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              title="Show UI"
            >
              <Eye className="w-5 h-5" />
            </button>
          )}
          {!isUIHidden && (
            <button
              onClick={() => setIsUIHidden(true)}
              className="w-10 h-10 rounded-xl bg-dark-surface/90 backdrop-blur-sm border border-dark-glassBorder flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              title="Hide UI"
            >
              <EyeOff className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-xl bg-dark-surface/90 backdrop-blur-sm border border-dark-glassBorder flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            title="Exit Fullscreen (Esc)"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>

        {/* UI Elements - Hidden when isUIHidden is true */}
        {!isUIHidden && (
          <>
            {/* Legend */}
            <div className="absolute top-4 left-4 flex items-center gap-6 px-4 py-2 rounded-xl bg-dark-surface/90 backdrop-blur-sm border border-dark-glassBorder z-10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
                <span className="text-xs text-zinc-400">You</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#06B6D4]" />
                <span className="text-xs text-zinc-400">Connection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                <span className="text-xs text-zinc-400">Company</span>
              </div>
            </div>

            {/* Edge labels info */}
            <div className="absolute bottom-4 left-4 flex gap-4 px-4 py-2 rounded-xl bg-dark-surface/90 backdrop-blur-sm border border-dark-glassBorder z-10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-[#8B5CF6]/60" />
                <span className="text-xs text-zinc-500">knows</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-[#F59E0B]/60" />
                <span className="text-xs text-zinc-500">works</span>
              </div>
            </div>

            {/* Escape hint */}
            <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-dark-surface/90 backdrop-blur-sm border border-dark-glassBorder z-10">
              <span className="text-xs text-zinc-500">Press <kbd className="px-1.5 py-0.5 rounded bg-dark-elevated text-zinc-400 font-mono text-[10px]">Esc</kbd> to exit</span>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      <Sidebar />

      <main className="flex-1 p-6 pb-20 md:pb-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-glassBorder flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Network Graph</h1>
              <p className="text-sm text-zinc-500">
                Your LinkedIn network visualized
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-glassBorder flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-5 h-5" />
            </button>

            {/* Legend */}
            <div className="flex items-center gap-6 px-4 py-2 rounded-xl bg-dark-surface border border-dark-glassBorder">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
                <span className="text-xs text-zinc-400">You</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#06B6D4]" />
                <span className="text-xs text-zinc-400">Connection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                <span className="text-xs text-zinc-400">Company</span>
              </div>
              <button
                onClick={() => setActiveFilter(activeFilter === "recruiter" ? null : "recruiter")}
                className={`flex items-center gap-2 px-2 py-1 -mx-2 -my-1 rounded-lg transition-colors ${activeFilter === "recruiter" ? "bg-emerald-500/20 ring-1 ring-emerald-500/40" : "hover:bg-white/5"
                  }`}
              >
                <div className="w-3 h-3 rounded-full border-2 border-[#10B981] bg-transparent" />
                <span className={`text-xs ${activeFilter === "recruiter" ? "text-emerald-400 font-medium" : "text-zinc-400"}`}>Recruiter</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-[#22D3EE] bg-transparent" />
                <span className="text-xs text-zinc-400">Network Root</span>
              </div>
            </div>
          </div>
        </div>

        {/* Graph Container */}
        <div className="flex-1 rounded-2xl bg-dark-surface border border-dark-glassBorder overflow-hidden relative">
          <Graph width={dimensions.width} height={dimensions.height} initialZoom={initialZoom} activeFilter={activeFilter} />

          {/* Edge labels info */}
          <div className="absolute bottom-4 left-4 flex gap-4 px-4 py-2 rounded-xl bg-dark-bg/80 backdrop-blur-sm border border-dark-glassBorder">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-[#8B5CF6]/60" />
              <span className="text-xs text-zinc-500">knows</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-[#F59E0B]/60" />
              <span className="text-xs text-zinc-500">works</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
