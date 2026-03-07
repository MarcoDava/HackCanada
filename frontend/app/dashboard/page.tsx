"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Waypoints, Home, Users, Upload, Settings, Search,
  ArrowUpRight, Zap, Droplets, ChevronLeft, ChevronRight
} from "lucide-react"


interface MetricBarProps {
  icon: React.ReactNode
  label: string
  value: string
  target: string
  percentage: number
  color: string
}


function MetricBar({ icon, label, value, target, percentage, color }: MetricBarProps) {
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
          className={`h-full rounded-full transition-all duration-500 ${color.replace('bg-', 'bg-').replace('/20', '')}`}
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


const navItems = [
  { icon: Home, href: "/dashboard", label: "Dashboard" },
  { icon: Users, href: "/connections", label: "Connections" },
  { icon: Upload, href: "/upload", label: "Upload" },
  { icon: Search, href: "/search", label: "Search" },
]


export default function Dashboard() {
  const pathname = usePathname()
  const [currentMonth] = useState(new Date())
  const [activeTime, setActiveTime] = useState("00:00:00")
  const [pathsFound, setPathsFound] = useState(0)
  const [bestDay, setBestDay] = useState(new Date().toLocaleDateString())
  const [messagesSent, setMessagesSent] = useState(0)
  const [responseRate, setResponseRate] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  const weeklyData = [//Needs to be set to real values
    { day: "Sun", height: 40 },
    { day: "Mon", height: 65 },
    { day: "Tue", height: 45 },
    { day: "Wed", height: 80 },
    { day: "Thu", height: 55 },
    { day: "Fri", height: 90, isActive: true },
    { day: "Sat", height: 35 },
  ]


  const metrics = {
    connections: { value: "0", target: "7", percentage: 0 },
    companies: { value: "0", target: "5", percentage: 0 },
  }


  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const day = i - 3
    return day > 0 && day <= 31 ? day : null
  })


  // Heatmap data: day -> number of connections (1-7)
  const connectionHeatmap: Record<number, number> = {
    1: 2,
    3: 5,
    4: 7,
    5: 3,
    8: 1,
    10: 6,
    11: 4,
    12: 7,
    14: 2,
    15: 3,
    17: 5,
    18: 1,
    20: 4,
    22: 6,
    23: 2,
    25: 7,
    27: 3,
    28: 5,
    30: 4,
  }


  // Get heatmap color based on connection count (1-7)
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
    return colors[connections] || ""
  }


  return (
    <div className="flex min-h-screen bg-dark-bg">
      <aside className="w-20 bg-dark-surface border-r border-dark-glassBorder flex flex-col items-center py-6 gap-2">
        <Link href="/" className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center mb-8 shadow-glow">
          <Waypoints className="w-6 h-6 text-white" />
        </Link>


        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-brand-500/20 text-brand-400"
                    : "text-zinc-500 hover:text-white hover:bg-dark-elevated"
                }`}
                title={item.label}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            )
          })}
        </nav>


        <div className="flex flex-col gap-2">
          <button className="w-12 h-12 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:bg-dark-elevated transition-all">
            <Settings className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-amber to-accent-rose" />
        </div>
      </aside>


      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-4 auto-rows-min">
         
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
                const isToday = day === 17
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
                <p className="text-lg font-semibold text-white">{activeTime}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Paths found</p>
                <p className="text-lg font-semibold text-white">{pathsFound}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Best day</p>
                <p className="text-lg font-semibold text-white">{bestDay}</p>
              </div>
            </div>
          </div>
                {/* TODO: 3D GRAPH GOES HERE */}
          <div className="col-span-12 lg:col-span-7 bg-gradient-to-br from-brand-600/40 via-brand-500/30 to-accent-cyan/20 rounded-3xl p-8 relative overflow-hidden min-h-[360px]">
            <div className="relative z-10">{/* TODO: 3D GRAPH GOES HERE */}
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                GRAPH GOES HERE,<br />
                DONT FORGET TO REPLACE THIS
              </h1>
              <p className="text-zinc-300 max-w-sm mb-6">
                Discover the warmest paths to any company with clarity and purpose.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <Zap className="w-4 h-4 text-accent-amber" />
                <span className="text-sm text-white">AI-Powered Path Discovery</span>
              </div>
            </div>
{/* TODO: 3D GRAPH GOES HERE */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-center">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 rounded-full border border-white/10 animate-pulse-slow" />
                <div className="absolute inset-6 rounded-full border border-white/10" />
                <div className="absolute inset-12 rounded-full border border-white/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-accent-cyan flex items-center justify-center shadow-glow">
                  <Waypoints className="w-8 h-8 text-white" />
                </div>
                {[
                  { top: "5%", left: "50%", color: "bg-accent-cyan" },
                  { top: "25%", left: "90%", color: "bg-purple-400" },
                  { top: "75%", left: "85%", color: "bg-accent-emerald" },
                  { top: "90%", left: "50%", color: "bg-accent-amber" },
                  { top: "70%", left: "10%", color: "bg-accent-rose" },
                  { top: "20%", left: "15%", color: "bg-blue-400" },
                ].map((node, i) => (
                  <div
                    key={i}
                    className={`absolute w-3 h-3 rounded-full ${node.color} shadow-lg animate-float`}
                    style={{
                      top: node.top,
                      left: node.left,
                      transform: "translate(-50%, -50%)",
                      animationDelay: `${i * 0.4}s`
                    }}
                  />
                ))}
              </div>
            </div>
{/* TODO: 3D GRAPH GOES HERE */}
            <div className="absolute bottom-6 right-6 flex gap-2">
             
            </div>
          </div>


          <div className="col-span-12 lg:col-span-5 space-y-4">
            <MetricBar
              icon={<Droplets className="w-5 h-5 text-accent-cyan" />}
              label="Connections"
              value={metrics.connections.value}
              target={metrics.connections.target}
              percentage={metrics.connections.percentage}
              color="bg-accent-cyan/20"
            />
            <MetricBar
              icon={<Zap className="w-5 h-5 text-accent-amber" />}
              label="Companies"
              value={metrics.companies.value}
              target={metrics.companies.target}
              percentage={metrics.companies.percentage}
              color="bg-accent-amber/20"
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


          <div className="col-span-6 lg:col-span-3 grid grid-cols-1 gap-4">
            <StatCard
              icon={<Droplets className="w-5 h-5 text-accent-cyan" />}
              value={responseRate.toString()}
              label="Response Rate"
              color="bg-accent-cyan/20"
            />
          </div>


        </div>
      </main>
    </div>
  )
}


