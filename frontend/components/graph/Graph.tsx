"use client"
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import axios from "axios"
import dynamic from "next/dynamic"
import { Search, X, ExternalLink, User, Briefcase, Calendar, Shield } from "lucide-react"

// @ts-ignore - dynamic import without types
const ForceGraph2D = dynamic(() => import("react-force-graph-2d").then(mod => mod.default || mod), { ssr: false })

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

type GraphNode = {
  id: string
  name: string
  type: "user" | "person" | "company"
  title?: string
  is_recruiter?: boolean
  initials?: string
  logo?: string
  profile_url?: string
  connected_on?: string
  is_source?: boolean
  network_name?: string
  x?: number
  y?: number
}

type GraphLink = {
  source: string | GraphNode
  target: string | GraphNode
  label: string
}

type GraphData = {
  nodes: GraphNode[]
  links: GraphLink[]
}

type Props = {
  width?: number
  height?: number
  initialZoom?: boolean
}

const NODE_COLORS: Record<string, string> = {
  user: "#8B5CF6",
  person: "#06B6D4",
  company: "#F59E0B",
}

const NODE_SIZES: Record<string, number> = {
  user: 10,
  person: 5,
  company: 7,
}

// Image cache for company logos
const logoCache = new Map<string, HTMLImageElement | null>()

function loadLogo(url: string): HTMLImageElement | null {
  if (!url) return null
  if (logoCache.has(url)) return logoCache.get(url)!
  logoCache.set(url, null)
  const img = new Image()
  img.crossOrigin = "anonymous"
  img.onload = () => logoCache.set(url, img)
  img.onerror = () => logoCache.set(url, null)
  img.src = url
  return null
}

export default function Graph({ width, height, initialZoom }: Props) {
  const fgRef = useRef<any>(null)
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hasInitialZoomed, setHasInitialZoomed] = useState(false)

  // Collect all company names for autocomplete
  const companyNames = useMemo(() => {
    return data.nodes
      .filter(n => n.type === "company")
      .map(n => n.name)
      .sort((a, b) => a.localeCompare(b))
  }, [data.nodes])

  // Filtered suggestions based on typed query
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return companyNames.filter(name => name.toLowerCase().includes(q)).slice(0, 8)
  }, [searchQuery, companyNames])

  // Pruned graph data: only matched company, its connections, and the user node
  const filteredData = useMemo<GraphData>(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return data

    // Find all company nodes that match
    const matchedCompanyIds = new Set(
      data.nodes
        .filter(n => n.type === "company" && n.name.toLowerCase().includes(q))
        .map(n => n.id)
    )

    if (matchedCompanyIds.size === 0) return data

    // Find all people connected to matched companies via WORKS_AT links
    const connectedPersonIds = new Set<string>()
    data.links.forEach(link => {
      const srcId = typeof link.source === "string" ? link.source : link.source.id
      const tgtId = typeof link.target === "string" ? link.target : link.target.id
      if (matchedCompanyIds.has(tgtId)) connectedPersonIds.add(srcId)
      if (matchedCompanyIds.has(srcId)) connectedPersonIds.add(tgtId)
    })

    // Always keep the user node
    const userNode = data.nodes.find(n => n.type === "user")
    if (userNode) connectedPersonIds.add(userNode.id)

    // Keep: matched companies + connected people + user
    const keepIds = new Set<string>()
    matchedCompanyIds.forEach(id => keepIds.add(id))
    connectedPersonIds.forEach(id => keepIds.add(id))

    const nodes = data.nodes.filter(n => keepIds.has(n.id))
    const links = data.links.filter(link => {
      const srcId = typeof link.source === "string" ? link.source : link.source.id
      const tgtId = typeof link.target === "string" ? link.target : link.target.id
      return keepIds.has(srcId) && keepIds.has(tgtId)
    })

    return { nodes, links }
  }, [data, searchQuery])

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      const userId = localStorage.getItem("user_id")
      if (!userId) {
        setError("No user found. Please upload your CSV first.")
        setLoading(false)
        return
      }
      try {
        const res = await axios.get(`${API_URL}/api/graph/overview`, {
          params: { user_id: userId },
        })
        if (!mounted) return
        setData(res.data)
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message ?? "Failed to load graph")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const handleNodeClick = useCallback((node: any) => {
    if (fgRef.current && node.x !== undefined && node.y !== undefined) {
      fgRef.current.centerAt(node.x, node.y, 600)
      fgRef.current.zoom(2.5, 600)
    }
    if (node.type === "person" || node.type === "user") {
      setSelectedNode(node as GraphNode)
    } else {
      setSelectedNode(null)
    }
  }, [])

  const handleEngineStop = useCallback(() => {
    if (initialZoom && !hasInitialZoomed && fgRef.current && data.nodes.length > 0) {
      setHasInitialZoomed(true)
      const userNode = data.nodes.find(n => n.type === "user")
      if (userNode && userNode.x !== undefined && userNode.y !== undefined) {
        fgRef.current.centerAt(userNode.x, userNode.y, 800)
        fgRef.current.zoom(2.5, 800)
      } else {
        fgRef.current.zoom(2.0, 800)
      }
    }
  }, [initialZoom, hasInitialZoomed, data])

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const r = NODE_SIZES[node.type] || 5
    const color = NODE_COLORS[node.type] || "#888"

    // Glow for user node
    if (node.type === "user") {
      ctx.beginPath()
      ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI)
      ctx.fillStyle = "rgba(139, 92, 246, 0.25)"
      ctx.fill()
    }

    // Halo for network root/source nodes (other uploaded networks)
    if (node.is_source && node.type === "person") {
      ctx.beginPath()
      ctx.arc(node.x, node.y, r + 6, 0, 2 * Math.PI)
      ctx.strokeStyle = "rgba(56, 189, 248, 0.7)" // cyan ring
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // Node circle
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()

    // Company logo inside node
    if (node.type === "company" && node.logo) {
      const logo = loadLogo(node.logo)
      if (logo) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(node.x, node.y, r - 1, 0, 2 * Math.PI)
        ctx.clip()
        ctx.drawImage(logo, node.x - (r - 1), node.y - (r - 1), (r - 1) * 2, (r - 1) * 2)
        ctx.restore()
        // Border around logo
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
        ctx.strokeStyle = "#F59E0B"
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    // Initials inside node (for user and person nodes)
    if (node.type !== "company" && node.initials) {
      const initFontSize = Math.max(r * 1.1, 3)
      ctx.font = `${initFontSize}px Inter, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillStyle = "#FFFFFF"
      ctx.fillText(node.initials, node.x, node.y)
    }

    // Recruiter ring
    if (node.is_recruiter) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, r + 2, 0, 2 * Math.PI)
      ctx.strokeStyle = "#10B981"
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // Label
    const fontSize = Math.max(10 / globalScale, 2)
    if (globalScale > 0.6 || node.type === "user" || node.type === "company") {
      ctx.font = `${node.type === "user" ? "bold " : ""}${fontSize}px Inter, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.fillStyle = node.type === "company" ? "#FCD34D" : "#E4E4E7"
      const label = node.is_source && node.network_name
        ? `${node.name} · ${node.network_name}`
        : node.name || ""
      ctx.fillText(label, node.x, node.y + r + 2)
    }
  }, [])

  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const src = link.source
    const tgt = link.target
    if (!src || !tgt || src.x == null || tgt.x == null) return

    ctx.beginPath()
    ctx.moveTo(src.x, src.y)
    ctx.lineTo(tgt.x, tgt.y)
    ctx.strokeStyle = link.label === "KNOWS" ? "rgba(139,92,246,0.3)" : "rgba(245,158,11,0.3)"
    ctx.lineWidth = link.label === "KNOWS" ? 0.8 : 0.5
    ctx.stroke()

    // Edge label when zoomed in
    if (globalScale > 1.5) {
      const mx = (src.x + tgt.x) / 2
      const my = (src.y + tgt.y) / 2
      const fontSize = Math.max(8 / globalScale, 2)
      ctx.font = `${fontSize}px Inter, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillStyle = "rgba(161,161,170,0.7)"
     //  ctx.fillText(link.label === "KNOWS" ? "knows" : "works at", mx, my)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Building your network graph...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-accent-rose">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Search Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-80">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            placeholder="Search companies..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-dark-bg/90 backdrop-blur-md border border-dark-glassBorder text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {isFocused && suggestions.length > 0 && (
          <div className="mt-1 rounded-xl bg-dark-bg/95 backdrop-blur-md border border-dark-glassBorder overflow-hidden shadow-lg">
            {suggestions.map(name => (
              <button
                key={name}
                onMouseDown={() => {
                  setSearchQuery(name)
                  setIsFocused(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-brand-500/20 hover:text-white transition-colors flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                {name}
              </button>
            ))}
          </div>
        )}

        {/* Active filter badge */}
        {searchQuery && filteredData !== data && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-xs text-zinc-400 bg-dark-bg/80 backdrop-blur-sm px-3 py-1 rounded-full border border-dark-glassBorder">
              Showing <span className="text-brand-400 font-medium">{filteredData.nodes.length}</span> nodes
              {" · "}
              <button onClick={() => setSearchQuery("")} className="text-accent-cyan hover:text-white transition-colors">
                Clear filter
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Person Detail Panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 z-10 w-72 rounded-2xl bg-dark-bg/95 backdrop-blur-md border border-dark-glassBorder shadow-lg overflow-hidden">
          {/* Header */}
          <div className="relative px-5 pt-5 pb-4 border-b border-dark-glassBorder">
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white ${
                  selectedNode.type === "user" ? "bg-[#8B5CF6]" : "bg-[#06B6D4]"
                }`}
              >
                {selectedNode.initials || selectedNode.name?.charAt(0) || "?"}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">{selectedNode.name}</h3>
                {selectedNode.type === "user" && (
                  <span className="text-xs text-brand-400 font-medium">You</span>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-5 py-4 space-y-3">
            {selectedNode.title && (
              <div className="flex items-start gap-3">
                <Briefcase className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-zinc-500">Position</p>
                  <p className="text-sm text-zinc-200">{selectedNode.title}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-zinc-500">Type</p>
                <p className="text-sm text-zinc-200 capitalize">{selectedNode.type === "user" ? "You" : "1st Connection"}</p>
              </div>
            </div>

            {selectedNode.is_recruiter && (
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-zinc-500">Recruiter</p>
                  <p className="text-sm text-emerald-400 font-medium">Yes</p>
                </div>
              </div>
            )}

            {selectedNode.connected_on && (
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                <div>
                  <p className     ="text-xs text-zinc-500">Connected On</p>
                  <p className="text-sm text-zinc-200">{selectedNode.connected_on}</p>
                </div>
              </div>
            )}
          </div>

          {/* LinkedIn Link */}
          {selectedNode.profile_url && (
            <div className="px-5 pb-4">
              <a
                href={selectedNode.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#0A66C2]/80 text-white text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View LinkedIn Profile
              </a>
            </div>
          )}
        </div>
      )}

      <ForceGraph2D
        ref={fgRef}
        graphData={filteredData}
        width={width}
        height={height}
        backgroundColor="rgba(0,0,0,0)"
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          const r = NODE_SIZES[node.type as string] || 5
          ctx.beginPath()
          ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI)
          ctx.fillStyle = color
          ctx.fill()
        }}
        linkCanvasObject={paintLink}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={0.9}
        onNodeClick={handleNodeClick}
        onBackgroundClick={() => setSelectedNode(null)}
        onEngineStop={handleEngineStop}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
    </div>
  )
}