"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import axios from "axios"
import { 
  Waypoints, Home, Users, Upload, Settings, Search,
  Building2, ArrowUpRight, Filter, SortAsc, ChevronRight, ChevronLeft, Loader2
} from "lucide-react"
import Sidebar from "@/components/Sidebar"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Connection {
  id: string
  name: string
  title: string
  company: string
  connected_on: string
  degree: string
  is_recruiter: boolean
  email?: string
  profile_url?: string
}


export default function ConnectionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCompany, setFilterCompany] = useState<string | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [companies, setCompanies] = useState<string[]>([])
  const pageSize = 25

  const fetchConnections = async () => {
    setLoading(true)
    const userId = localStorage.getItem("user_id") || ""
    if (!userId) {
      setLoading(false)
      return
    }
    try {
      const res = await axios.get(`${API_URL}/api/graph/connections`, {
        params: {
          user_id: userId,
          page: currentPage,
          page_size: pageSize,
          search: searchQuery || undefined,
          company: filterCompany || undefined
        }
      })
      setConnections(res.data.connections || [])
      setTotalCount(res.data.total_count || 0)
    } catch (e) {
      console.error("Failed to fetch connections:", e)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanies = async () => {
    const userId = localStorage.getItem("user_id") || ""
    if (!userId) return
    try {
      const res = await axios.get(`${API_URL}/api/graph/companies`, {
        params: { user_id: userId }
      })
      setCompanies(res.data || [])
    } catch (e) {
      console.error("Failed to fetch companies:", e)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConnections()
    }, 300)
    return () => clearTimeout(timer)
  }, [currentPage, searchQuery, filterCompany])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterCompany])

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      <Sidebar />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="sticky top-0 z-30 bg-dark-bg/95 backdrop-blur-sm -mx-6 px-6 pt-2 pb-6 border-b border-dark-glassBorder mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Connections</h1>
                <p className="text-zinc-400">{loading ? "Loading..." : `${totalCount} people in your network`}</p>
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
          </div>

          <div className="bg-dark-surface rounded-3xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-dark-glassBorder text-sm text-zinc-500">
              <div className="col-span-4 flex items-center gap-2">
                <span>Name</span>
                <SortAsc className="w-3.5 h-3.5" />
              </div>
              <div className="col-span-3">Company</div>
              <div className="col-span-2">Degree</div>
              <div className="col-span-2">Role</div>
                <div className="col-span-1"></div>
            </div>

            <div className="divide-y divide-dark-glassBorder">
              {loading ? (
                <div className="px-6 py-24 text-center">
                  <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-4" />
                  <p className="text-zinc-400">Loading connections...</p>
                </div>
              ) : connections.length > 0 ? (
                connections.map((connection) => (
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
                          <p className="text-sm text-zinc-500">{connection.title}</p>
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
                      <span className="text-sm text-zinc-400 truncate block">
                        {connection.is_recruiter ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
                            Recruiter
                          </span>
                        ) : (
                          connection.title ? connection.title.split(" ").slice(0, 3).join(" ") : "—"
                        )}
                      </span>
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

          <div className="flex flex-col md:flex-row items-center justify-between mt-6 px-2 gap-4 pb-12">
            <div className="flex items-center gap-4 order-2 md:order-1">
              <button 
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40 h-10"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-sm text-zinc-500 font-medium whitespace-nowrap">
                Page {currentPage} of {Math.ceil(totalCount / pageSize) || 1}
              </span>
              <button 
                disabled={currentPage >= Math.ceil(totalCount / pageSize) || loading}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40 h-10"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-zinc-500 order-1 md:order-2">
              Showing {connections.length} of {totalCount} connections
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
