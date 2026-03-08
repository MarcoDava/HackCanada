"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import { Upload, Users, Network, FileText, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import Sidebar from "@/components/Sidebar"

const API_URL = process.env.NEXT_PUBLIC_API_URL

type NetworkInfo = {
  id: string
  name: string
  root_person_name: string
  root_person_title?: string
  is_primary: boolean
  connections: number
}

export default function ExpandNetworkPage() {
  const [file, setFile] = useState<File | null>(null)
  const [sourceName, setSourceName] = useState("")
  const [sourceEmail, setSourceEmail] = useState("")
  const [sourceTitle, setSourceTitle] = useState("")
  const [networkName, setNetworkName] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [result, setResult] = useState<any>(null)
  const [networks, setNetworks] = useState<NetworkInfo[]>([])
  const [loadingNetworks, setLoadingNetworks] = useState(true)

  useEffect(() => {
    const ownerId = localStorage.getItem("user_id")
    if (!ownerId) {
      setLoadingNetworks(false)
      return
    }
    const loadNetworks = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/graph/networks`, {
          params: { owner_user_id: ownerId },
        })
        setNetworks(res.data.networks || [])
      } catch (e) {
        console.error("Failed to load networks", e)
      } finally {
        setLoadingNetworks(false)
      }
    }
    loadNetworks()
  }, [])

  const handleUpload = async () => {
    if (!file || !sourceName) return
    const ownerId = localStorage.getItem("user_id") || ""
    if (!ownerId) {
      alert("Please upload your own Connections.csv first so we can attach additional networks to your profile.")
      return
    }

    setStatus("loading")
    const formData = new FormData()
    formData.append("file", file)

    try {
      const params = new URLSearchParams()
      params.set("owner_user_id", ownerId)
      params.set("source_name", sourceName)
      if (sourceTitle) params.set("source_title", sourceTitle)
      if (sourceEmail) params.set("source_email", sourceEmail)
      if (networkName) params.set("network_name", networkName)

      const res = await axios.post(
        `${API_URL}/api/upload/network?${params.toString()}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      )
      setResult(res.data)
      setStatus("done")
      setFile(null)

      // Refresh networks list
      const nets = await axios.get(`${API_URL}/api/graph/networks`, {
        params: { owner_user_id: ownerId },
      })
      setNetworks(nets.data.networks || [])
    } catch (e) {
      console.error("Failed to upload additional network", e)
      setStatus("error")
    }
  }

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      <Sidebar />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Expand Your Network</h1>
              <p className="text-zinc-400">
                Upload additional LinkedIn Connections.csv files from trusted contacts to grow your multi-degree network.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Whose network is this?
                  </label>
                  <input
                    type="text"
                    placeholder="Full name as it appears on LinkedIn"
                    value={sourceName}
                    onChange={e => setSourceName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Email (optional, improves matching)
                    </label>
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={sourceEmail}
                      onChange={e => setSourceEmail(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Title (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Engineer, Recruiter"
                      value={sourceTitle}
                      onChange={e => setSourceTitle(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Network label (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alice's Network, Toronto Tech Friends"
                    value={networkName}
                    onChange={e => setNetworkName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Connections CSV
                  </label>
                  <label className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer border-dark-glassBorder hover:border-zinc-600 hover:bg-dark-elevated/50 transition-all">
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                    {file ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent-emerald/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-accent-emerald" />
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">{file.name}</p>
                          <p className="text-sm text-zinc-500">Click to replace</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 mb-3 text-zinc-500" />
                        <p className="text-zinc-300 font-medium mb-1">
                          Choose a Connections.csv file
                        </p>
                        <p className="text-sm text-zinc-500">Exported from LinkedIn for your contact</p>
                      </div>
                    )}
                  </label>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!file || !sourceName || status === "loading"}
                  className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Adding Network...
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5" />
                      Add Network
                    </>
                  )}
                </button>

                {status === "done" && result && (
                  <div className="mt-4 flex items-center gap-3 text-sm text-accent-emerald">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{result.message}</span>
                  </div>
                )}

                {status === "error" && (
                  <div className="mt-4 flex items-center gap-3 text-sm text-accent-rose">
                    <AlertCircle className="w-5 h-5" />
                    <span>Something went wrong while adding this network. Please try again.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-accent-cyan" />
                  <h2 className="text-sm font-semibold text-white">Uploaded Networks</h2>
                </div>
                {loadingNetworks ? (
                  <div className="flex items-center justify-center py-6 text-zinc-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading networks...
                  </div>
                ) : networks.length === 0 ? (
                  <p className="text-zinc-500 text-sm">
                    No additional networks yet. Start by uploading a trusted contact&apos;s Connections.csv.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {networks.map(net => (
                      <div
                        key={net.id}
                        className="rounded-xl border border-dark-glassBorder bg-dark-bg/70 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {net.name}
                              {net.is_primary && (
                                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/30">
                                  Primary
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-zinc-500">
                              Root: {net.root_person_name}
                              {net.root_person_title ? ` · ${net.root_person_title}` : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-zinc-300 font-medium">
                              {net.connections}
                            </p>
                            <p className="text-[11px] text-zinc-500">connections</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card p-5 text-xs text-zinc-500 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-accent-amber mt-0.5" />
                  <div>
                    <p className="text-zinc-300 font-medium mb-1">How this works</p>
                    <p>
                      We merge people only when we have high-confidence matches (like exact email or exact name + company).
                      Otherwise, separate people are connected through shared companies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

