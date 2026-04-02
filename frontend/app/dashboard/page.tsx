"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Waypoints, ArrowUpRight, Zap, Droplets, ChevronLeft, ChevronRight, Maximize2, X
} from "lucide-react"
import Sidebar from "@/components/Sidebar"
import Graph from "@/components/graph/Graph"
import { useAuth, useAuthenticatedAxios } from "@/components/AuthContext"


interface MetricBarProps {
  icon: React.ReactNode
  label: string
  value: string
  target: string
  percentage: number
  color: string
}


function MetricBar({ icon, label, value, target, percentage, color, barColor }: MetricBarProps & { barColor: string }) {
  return (
    <div className="bg-dark-surface rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="text-white font-semibold">{value} <span className="text-zinc-500 font-normal">/ {target}</span></p>
        </div>
        <span className="text-sm text-zinc-400">{percentage}%</span>
      </div>
      <div className="h-1.5 bg-dark-elevated rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}


interface StatCardProps {
  icon: React.ReactNode
  value: string
  label: string
  color: string
}


function StatCard({ icon, value, label, color }: StatCardProps) {
  return (
    <div className="bg-dark-surface rounded-2xl p-5 flex flex-col items-center justify-center text-center min-h-[120px]">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  )
}

interface WeeklyBarProps {
  day: string
  height: number
  isActive?: boolean
}

function WeeklyBar({ day, height, isActive }: WeeklyBarProps) {
  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <div className="w-full h-24 bg-dark-elevated rounded-lg relative overflow-hidden">
        <div
          className={`absolute bottom-0 left-0 right-0 rounded-lg transition-all duration-500 ${isActive ? 'bg-gradient-to-t from-accent-rose to-accent-amber' : 'bg-gradient-to-t from-accent-rose/60 to-accent-amber/60'}`}
          style={{ height: `${height}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500">{day}</span>
    </div>
  )
}

export default function Dashboard() {
  const pathname = usePathname()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const getAuthAxios = useAuthenticatedAxios()
  const [currentMonth] = useState(new Date())
  const [activeSeconds, setActiveSeconds] = useState(0)
  const [connectionsMade, setConnectionsMade] = useState(0)
  const [bestDay, setBestDay] = useState("—")
  const [messagesSent, setMessagesSent] = useState(0)
  const [connectionsVisited, setConnectionsVisited] = useState(0)
  const [companiesVisited, setCompaniesVisited] = useState(0)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [connectionHeatmap, setConnectionHeatmap] = useState<Record<number, number>>({})
  const [weeklyData, setWeeklyData] = useState<{ day: string; height: number; isActive?: boolean }[]>(
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => ({ day: d, height: 0 }))
  )
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showUI, setShowUI] = useState(true)
  const activeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Handle Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isFullscreen])
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const unsavedSecondsRef = useRef(0)
  const initialLoadDone = useRef(false)

  // Fetch stored active time on load
  useEffect(() => {
    if (!isAuthenticated || authLoading || initialLoadDone.current) return
    async function fetchActiveTime() {
      try {
        const axios = await getAuthAxios()
        const res = await axios.get("/api/messages/active-time")
        setActiveSeconds(res.data.total_seconds || 0)
        initialLoadDone.current = true
      } catch (e) {
        console.error("Failed to fetch active time:", e)
        initialLoadDone.current = true
      }
    }
    fetchActiveTime()
  }, [isAuthenticated, authLoading, getAuthAxios])

  // Save active time to backend periodically (every 30 seconds) and on unmount
  const saveActiveTime = useCallback(async () => {
    if (unsavedSecondsRef.current <= 0 || !isAuthenticated) return
    const secondsToSave = unsavedSecondsRef.current
    unsavedSecondsRef.current = 0
    try {
      const axios = await getAuthAxios()
      await axios.post("/api/messages/active-time", { seconds: secondsToSave })
    } catch (e) {
      unsavedSecondsRef.current += secondsToSave
      console.error("Failed to save active time:", e)
    }
  }, [isAuthenticated, getAuthAxios])

  // Active time tracking – counts seconds while the page is visible
  useEffect(() => {
    const tick = () => {
      setActiveSeconds(s => s + 1)
      unsavedSecondsRef.current += 1
    }
    const start = () => { if (!activeTimerRef.current) activeTimerRef.current = setInterval(tick, 1000) }
    const stop = () => { if (activeTimerRef.current) { clearInterval(activeTimerRef.current); activeTimerRef.current = null } }

    start()
    saveTimerRef.current = setInterval(saveActiveTime, 30000)

    const onVis = () => (document.hidden ? stop() : start())
    document.addEventListener("visibilitychange", onVis)
    
    const onBeforeUnload = () => { saveActiveTime() }
    window.addEventListener("beforeunload", onBeforeUnload)

    return () => { 
      stop()
      if (saveTimerRef.current) clearInterval(saveTimerRef.current)
      saveActiveTime()
      document.removeEventListener("visibilitychange", onVis)
      window.removeEventListener("beforeunload", onBeforeUnload)
    }
  }, [saveActiveTime])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, "0")
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0")
    const sec = (s % 60).toString().padStart(2, "0")
    return `${h}:${m}:${sec}`
  }

  // Fetch real stats
  useEffect(() => {
    if (!isAuthenticated || authLoading) return
    async function fetchStats() {
      try {
        const axios = await getAuthAxios()
        const [messagesRes, visitsRes, dailyRes] = await Promise.all([
          axios.get("/api/messages/stats"),
          axios.get("/api/messages/visit-stats"),
          axios.get("/api/messages/daily-visits"),
        ])
        setMessagesSent(messagesRes.data.messages_sent || 0)
        setConnectionsVisited(visitsRes.data.connections_visited || 0)
        setCompaniesVisited(visitsRes.data.companies_visited || 0)

        // Heatmap
        const daily: Record<string, number> = dailyRes.data.daily || {}
        const heatmap: Record<number, number> = {}
        let totalMonth = 0
        let maxCount = 0
        let maxDay = 0
        for (const [dayStr, count] of Object.entries(daily)) {
          const d = parseInt(dayStr, 10)
          heatmap[d] = count as number
          totalMonth += count as number
          if ((count as number) > maxCount) { maxCount = count as number; maxDay = d }
        }
        setConnectionHeatmap(heatmap)
        setConnectionsMade(totalMonth)

        // Best day
        if (maxDay > 0) {
          const yr = dailyRes.data.year
          const mo = dailyRes.data.month
          const date = new Date(yr, mo - 1, maxDay)
          setBestDay(date.toLocaleDateString(undefined, { month: "short", day: "numeric" }))
        }

        // Weekly bars (last 7 days)
        const today = new Date()
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        const bars: { day: string; height: number; isActive?: boolean }[] = []
        const weekCounts: number[] = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today)
          d.setDate(today.getDate() - i)
          weekCounts.push(heatmap[d.getDate()] || 0)
          bars.push({ day: dayNames[d.getDay()], height: 0, isActive: i === 0 })
        }
        const maxWeek = Math.max(...weekCounts, 1)
        bars.forEach((b, idx) => { b.height = Math.round((weekCounts[idx] / maxWeek) * 100) })
        setWeeklyData(bars)
      } catch (e) {
        console.error("Failed to fetch stats:", e)
      }
    }
    fetchStats()
  }, [isAuthenticated, authLoading, getAuthAxios])


  const metrics = {
    connections: { 
      value: connectionsVisited.toString(), 
      target: "7", 
      percentage: Math.min(100, Math.round((connectionsVisited / 7) * 100)) 
    },
    companies: { 
      value: companiesVisited.toString(), 
      target: "5", 
      percentage: Math.min(100, Math.round((companiesVisited / 5) * 100)) 
    },
  }


  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const day = i - 3
    return day > 0 && day <= 31 ? day : null
  })


  const getHeatmapColor = (connections: number): string => {
    const colors: Record<number, string> = {
      1: "bg-purple-500/20",
      2: "bg-purple-500/30",
      3: "bg-purple-500/40",
      4: "bg-purple-500/55",
      5: "bg-purple-500/70",
      6: "bg-purple-500/85",
      7: "bg-purple-500",
    }
    return colors[Math.min(connections, 7)] || ""
  }


  return (
    <div className={`flex h-screen bg-dark-bg overflow-hidden ${isFullscreen ? "p-0" : ""}`}>
      {showUI && !isFullscreen && <Sidebar />}

      <main className={`flex-1 overflow-auto transition-all duration-300 ${isFullscreen ? "p-0" : "p-6 pb-20 md:pb-6"}`}>
        {/* Reveal UI Button */}
        {!showUI && !isFullscreen && (
          <button
            onClick={() => setShowUI(true)}
            className="fixed top-4 right-4 z-[100] px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium shadow-lg transition-all"
          >
            Reveal UI
          </button>
        )}

        <div className={`${isFullscreen ? "w-full h-full" : "max-w-7xl mx-auto"} grid grid-cols-12 gap-4 auto-rows-min h-full`}>
         
          {showUI && !isFullscreen && (
            <div className="col-span-12 lg:col-span-5 bg-dark-surface rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Network Activity</h2>
              <button className="w-8 h-8 rounded-lg bg-dark-elevated flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>


            <div className="flex items-center justify-between mb-4">
              <button className="text-zinc-500 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-8 text-sm">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                  <span key={d} className="text-zinc-500 w-[1.370rem] text-center">{d}</span>
                ))}
              </div>
              <button className="text-zinc-500 hover:text-white transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>


            <div className="grid grid-cols-7 gap-2 mb-6">
              {calendarDays.map((day, i) => {
                const connections = day ? connectionHeatmap[day] : undefined
                const isToday = day === new Date().getDate()
                const heatmapColor = connections ? getHeatmapColor(connections) : ""
               
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-full flex items-center justify-center text-sm relative transition-all cursor-pointer group ${
                      day === null
                        ? "text-zinc-700"
                        : isToday
                          ? "bg-purple-500 text-white font-medium ring-2 ring-purple-400 ring-offset-2 ring-offset-dark-surface"
                          : connections
                            ? `${heatmapColor} text-white hover:ring-1 hover:ring-purple-400/50`
                            : "text-zinc-500 hover:bg-dark-elevated"
                    }`}
                    title={connections ? `${connections} connection${connections > 1 ? 's' : ''} made` : undefined}
                  >
                    {day}
                    {connections && !isToday && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        {connections}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>


            {/* Heatmap legend */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-[10px] text-zinc-500">Less</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((level) => (
                  <div
                    key={level}
                    className={`w-3 h-3 rounded-sm ${getHeatmapColor(level)}`}
                    title={`${level} connection${level > 1 ? 's' : ''}`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-zinc-500">More</span>
            </div>


            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-dark-glassBorder">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Active time</p>
                <p className="text-lg font-semibold text-white">{formatTime(activeSeconds)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Connections made</p>
                <p className="text-lg font-semibold text-white">{connectionsMade}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Best day</p>
                <p className="text-lg font-semibold text-white">{bestDay}</p>
              </div>
            </div>
            </div>
          )}

          {/* Graph Section */}
          <div className={`${
            isFullscreen 
              ? "fixed inset-0 z-50 bg-dark-bg" 
              : "col-span-12 lg:col-span-7 bg-gradient-to-br from-brand-600/40 via-brand-500/30 to-accent-cyan/20 rounded-3xl p-8 min-h-[360px]"
            } relative overflow-hidden group transition-all duration-300`}
          >
              <div className="absolute top-4 right-4 z-[60] flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Fullscreen Toggle */}
                <button 
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="w-10 h-10 rounded-xl bg-dark-bg/80 backdrop-blur-md border border-dark-glassBorder flex items-center justify-center text-zinc-400 hover:text-white hover:bg-dark-surface transition-all"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Graph"}
                >
                  {isFullscreen ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>

                {/* Hide UI Toggle (only visible when not in actual OS fullscreen, but we use it as a 'Zen' mode) */}
                {!isFullscreen && (
                  <button 
                    onClick={() => setShowUI(false)}
                    className="w-10 h-10 rounded-xl bg-dark-bg/80 backdrop-blur-md border border-dark-glassBorder flex items-center justify-center text-zinc-400 hover:text-white hover:bg-dark-surface transition-all"
                    title="Hide UI"
                  >
                    <Zap className="w-5 h-5" />
                  </button>
                )}
              </div>

              <Graph 
                width={isFullscreen ? (typeof window !== 'undefined' ? window.innerWidth : 1200) : dimensions.width} 
                height={isFullscreen ? (typeof window !== 'undefined' ? window.innerHeight : 800) : dimensions.height} 
              />
            </div>

          {showUI && !isFullscreen && (
            <>
              <div className="col-span-12 lg:col-span-5 space-y-4">
            <MetricBar
              icon={<Droplets className="w-5 h-5 text-accent-cyan" />}
              label="Connections"
              value={metrics.connections.value}
              target={metrics.connections.target}
              percentage={metrics.connections.percentage}
              color="bg-accent-cyan/20"
              barColor="bg-accent-cyan"
            />
            <MetricBar
              icon={<Zap className="w-5 h-5 text-accent-amber" />}
              label="Companies"
              value={metrics.companies.value}
              target={metrics.companies.target}
              percentage={metrics.companies.percentage}
              color="bg-accent-amber/20"
              barColor="bg-accent-amber"
            />
          </div>


          <div className="col-span-12 lg:col-span-4 bg-dark-surface rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Connections Made</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-rose" />
                <span className="text-xs text-zinc-500">Last week</span>
              </div>
            </div>
           
            <div className="flex gap-2">
              {weeklyData.map((bar, i) => (
                <WeeklyBar key={i} {...bar} />
              ))}
            </div>
          </div>


          <div className="col-span-6 lg:col-span-3 grid grid-cols-1 gap-4">
            <StatCard
              icon={<Zap className="w-5 h-5 text-accent-amber" />}
              value={messagesSent.toString()}
              label="Messages Sent"
              color="bg-accent-amber/20"
            />
          </div>
        </>
      )}

        </div>
      </main>
    </div>
  )
}


