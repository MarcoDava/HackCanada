"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Waypoints, Home, Users, Upload, Settings, Search,
  Building2, ArrowUpRight, Filter, SortAsc, ChevronRight
} from "lucide-react"

interface Connection {
  id: string
  name: string
  role: string
  company: string
  connectedDate: string
  degree: "1st" | "2nd"
  matchScore: number
}

const navItems = [
  { icon: Home, href: "/dashboard", label: "Dashboard" },
  { icon: Users, href: "/connections", label: "Connections" },
  { icon: Upload, href: "/upload", label: "Upload" },
  { icon: Search, href: "/search", label: "Search" },
]

export default function ConnectionsPage() {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCompany, setFilterCompany] = useState<string | null>(null)

  const connections: Connection[] = [
    { id: "1", name: "Sarah Jenkins", role: "Senior Software Engineer", company: "Google", connectedDate: "2024-01-15", degree: "1st", matchScore: 98 },
    { id: "2", name: "David Chen", role: "Engineering Manager", company: "Google", connectedDate: "2023-11-20", degree: "1st", matchScore: 85 },
    { id: "3", name: "Priya Patel", role: "Technical Recruiter", company: "Microsoft", connectedDate: "2024-02-08", degree: "1st", matchScore: 72 },
    { id: "4", name: "James Wilson", role: "Product Manager", company: "Stripe", connectedDate: "2023-09-12", degree: "1st", matchScore: 68 },
    { id: "5", name: "Emily Zhang", role: "Data Scientist", company: "Meta", connectedDate: "2024-01-03", degree: "2nd", matchScore: 45 },
    { id: "6", name: "Michael Brown", role: "Frontend Developer", company: "Amazon", connectedDate: "2023-12-18", degree: "1st", matchScore: 82 },
  ]

  const companies = [...new Set(connections.map(c => c.company))]

  const filteredConnections = connections.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.role.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = !filterCompany || c.company === filterCompany
    return matchesSearch && matchesFilter
  })

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
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Connections</h1>
              <p className="text-zinc-400">{connections.length} people in your network</p>
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search connections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-dark-surface border border-dark-glassBorder rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 w-64 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              
              <div className="relative">
                <select
                  value={filterCompany || ""}
                  onChange={(e) => setFilterCompany(e.target.value || null)}
                  className="appearance-none bg-dark-surface border border-dark-glassBorder rounded-xl pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors cursor-pointer"
                >
                  <option value="">All Companies</option>
                  {companies.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="bg-dark-surface rounded-3xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-dark-glassBorder text-sm text-zinc-500">
              <div className="col-span-4 flex items-center gap-2">
                <span>Name</span>
                <SortAsc className="w-3.5 h-3.5" />
              </div>
              <div className="col-span-3">Company</div>
              <div className="col-span-2">Degree</div>
              <div className="col-span-2">Match Score</div>
              <div className="col-span-1"></div>
            </div>

            <div className="divide-y divide-dark-glassBorder">
              {filteredConnections.length > 0 ? (
                filteredConnections.map((connection) => (
                  <div 
                    key={connection.id} 
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-dark-elevated/50 transition-colors group"
                  >
                    <div className="col-span-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-cyan/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {connection.name.split(" ").map(n => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{connection.name}</p>
                          <p className="text-sm text-zinc-500">{connection.role}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-dark-elevated flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-zinc-400" />
                        </div>
                        <span className="text-zinc-300">{connection.company}</span>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        connection.degree === "1st" 
                          ? "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20"
                          : "bg-accent-amber/10 text-accent-amber border border-accent-amber/20"
                      }`}>
                        {connection.degree}
                      </span>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-dark-elevated rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              connection.matchScore >= 80 
                                ? "bg-accent-emerald" 
                                : connection.matchScore >= 60 
                                  ? "bg-accent-amber"
                                  : "bg-zinc-500"
                            }`}
                            style={{ width: `${connection.matchScore}%` }}
                          />
                        </div>
                        <span className="text-sm text-zinc-400 w-10">{connection.matchScore}%</span>
                      </div>
                    </div>
                    
                    <div className="col-span-1 flex justify-end">
                      <Link
                        href={`/search?q=${connection.company}`}
                        className="w-8 h-8 rounded-lg bg-dark-elevated flex items-center justify-center text-zinc-500 hover:text-white hover:bg-brand-500/20 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400 mb-2">No connections found</p>
                  <p className="text-sm text-zinc-500">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 px-2">
            <p className="text-sm text-zinc-500">
              Showing {filteredConnections.length} of {connections.length} connections
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import more connections
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
