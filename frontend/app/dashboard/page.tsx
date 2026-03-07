"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Waypoints, ArrowUpRight, Zap, Droplets, ChevronLeft, ChevronRight, Maximize2
} from "lucide-react"
import Sidebar from "@/components/Sidebar"
import Graph from "@/components/graph/Graph"


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

export default function Dashboard() {
  const pathname = usePathname()
  const [currentMonth] = useState(new Date())
  const [activeTime, setActiveTime] = useState("00:00:00")
  const [pathsFound, setPathsFound] = useState(0)
  const [bestDay, setBestDay] = useState(new Date().toLocaleDateString())
  const [messagesSent, setMessagesSent] = useState(0)
  const [responseRate, setResponseRate] = useState(0)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
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
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      <Sidebar />

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
          <div className="col-span-12 lg:col-span-7 bg-gradient-to-br from-brand-600/40 via-brand-500/30 to-accent-cyan/20 rounded-3xl p-8 relative overflow-hidden min-h-[360px] group">
              <Link 
                href="/graph?zoom=true"
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-xl bg-dark-bg/80 backdrop-blur-md border border-dark-glassBorder flex items-center justify-center text-zinc-400 hover:text-white hover:bg-dark-surface transition-all opacity-0 group-hover:opacity-100"
                title="Fullscreen Graph"
              >
                <Maximize2 className="w-5 h-5" />
              </Link>
              <Graph width={dimensions.width} height={dimensions.height} />
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


