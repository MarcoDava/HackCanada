"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { Waypoints, Sparkles, MessageSquare, Copy, ChevronLeft, User, Building2, ArrowRight, CheckCircle2, Search, Loader2, Mail, ExternalLink } from "lucide-react"
import Link from "next/link"
import Sidebar from "@/components/Sidebar"
import { useState, useEffect, useRef, Suspense } from "react"
import { useAuth, useAuthenticatedAxios } from "@/components/AuthContext"


interface Contact {
  id?: string
  name: string
  title?: string
  company?: string
  email?: string
  profile_url?: string
  degree: number
  is_recruiter?: boolean
  bridge?: { name: string; title?: string }
}

interface SearchResults {
  company: string
  total_connections: number
  first_degree_count: number
  second_degree_count: number
  third_degree_count: number
  recruiters: Contact[]
  top_connections: Contact[]
  page: number
  page_size: number
}

function SearchPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const getAuthAxios = useAuthenticatedAxios()
  
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [aiMessage, setAiMessage] = useState("")
  const [messageLoading, setMessageLoading] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState(false)
  const [emailError, setEmailError] = useState(false)
  const [searchPage, setSearchPage] = useState(1)
  const pageSize = 25
  const autoTriggered = useRef(false)
  const personParam = searchParams.get("person") || ""

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  const search = async (pageOverride?: number) => {
    if (!query) return
    const targetPage = pageOverride || 1
    setLoading(true)
    if (!pageOverride) {
      setResults(null)
      setSelectedContact(null)
      setAiMessage("")
      setSearchPage(1)
    }
    setEmailError(false)
    
    try {
      const axios = await getAuthAxios()
      const res = await axios.get("/api/search/company", {
        params: { 
          company: query, 
          page: targetPage,
          page_size: pageSize
        }
      })
      setResults(res.data)
      if (res.data.top_connections?.length > 0 && !pageOverride) {
        setSelectedContact(res.data.top_connections[0])
      }
      setSearchPage(targetPage)
    } catch (e) {
      console.error("Search failed:", e)
    } finally {
      setLoading(false)
    }
  }

  // Auto-trigger search when navigating from graph with ?q=Company&person=Name
  useEffect(() => {
    if (autoTriggered.current || !isAuthenticated || authLoading) return
    const q = searchParams.get("q")
    if (q && !results) {
      autoTriggered.current = true
      search()
    }
  }, [isAuthenticated, authLoading, searchParams])

  // Auto-select person and generate message when results load from URL param
  useEffect(() => {
    if (!personParam || !results) return
    const match = results.top_connections.find(
      c => c.name.toLowerCase() === personParam.toLowerCase()
    ) || results.recruiters?.find(
      c => c.name.toLowerCase() === personParam.toLowerCase()
    )
    if (match && match !== selectedContact) {
      generateMessage(match)
    }
  }, [results, personParam])

  const generateMessage = async (contact: Contact) => {
    setSelectedContact(contact)
    setMessageLoading(true)
    setAiMessage("")
    setEmailError(false)
    
    try {
      const axios = await getAuthAxios()
      const res = await axios.post("/api/messages/generate", {
        target_person: contact,
        target_company: query,
        bridge_person: contact.bridge || null,
      })
      setAiMessage(res.data.message)
    } catch (e) {
      setAiMessage(`Error: ${(e as any)?.response?.data?.detail || "Could not generate message. Try again in a moment."}`)
    } finally {
      setMessageLoading(false)
    }
  }

  const logOutreach = async (channel: "copy" | "email") => {
    if (!selectedContact) return
    try {
      const axios = await getAuthAxios()
      await axios.post("/api/messages/log", {
        target_name: selectedContact.name,
        target_company: query,
        channel,
      })
    } catch (e) {
      console.error("Failed to log outreach:", e)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(aiMessage)
    setCopiedMessage(true)
    logOutreach("copy")
    setTimeout(() => setCopiedMessage(false), 2000)
  }

  if (authLoading) {
    return (
      <div className="flex h-screen bg-dark-bg items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  const bestContact = results?.top_connections?.[0] || null

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      <Sidebar />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto animate-fade-in">
          <div className="sticky top-0 z-30 bg-dark-bg/95 backdrop-blur-sm -mx-6 px-6 pt-2 pb-6 border-b border-dark-glassBorder mb-8">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors mb-4">
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Find Your Path</h1>
                <p className="text-zinc-400">Search a company to discover your warmest connections.</p>
              </div>

              <div className="flex gap-3 w-full md:w-auto md:min-w-[400px]">
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && search()}
                  placeholder="e.g. Google, Shopify, OpenAI..."
                  className="flex-1 bg-dark-surface border border-dark-glassBorder rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
                <button onClick={() => search()} disabled={loading || !query} className="btn-primary px-6 py-3 disabled:opacity-40">
                  {loading ? (<><Loader2 className="w-5 h-5 animate-spin" />Searching...</>) : (<><Search className="w-5 h-5" />Search</>)}
                </button>
              </div>
            </div>
          </div>

          {results && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {bestContact && (
                  <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Waypoints className="w-5 h-5 text-brand-400" />
                      <h2 className="text-lg font-semibold text-white">Best Referral Path</h2>
                    </div>
                    <div className="bg-dark-bg/50 rounded-xl p-8 border border-dark-glassBorder relative overflow-hidden">
                      <div className="flex items-center justify-center gap-4 sm:gap-8">
                        <div className="text-center">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center mx-auto mb-3 shadow-glow">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <p className="text-sm font-medium text-white">You</p>
                        </div>
                        {bestContact.degree >= 2 && bestContact.bridge && (
                          <>
                            <div className="flex-1 max-w-[80px] flex flex-col items-center">
                              <div className="h-0.5 w-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full" />
                              <span className="text-[10px] text-zinc-500 mt-2">Bridge</span>
                            </div>
                            <div className="text-center">
                              <div className="w-14 h-14 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center mx-auto mb-3">
                                <User className="w-6 h-6 text-purple-400" />
                              </div>
                              <p className="text-sm font-medium text-white">{bestContact.bridge.name.split(" ")[0]}</p>
                              <p className="text-xs text-purple-400">{bestContact.degree === 2 ? "1st-degree bridge" : "1st bridge"}</p>
                            </div>
                          </>
                        )}
                        {bestContact.degree === 3 && (bestContact as any).bridge2 && (
                          <>
                            <div className="flex-1 max-w-[80px] flex flex-col items-center">
                              <div className="h-0.5 w-full bg-gradient-to-r from-purple-500 to-accent-emerald rounded-full" />
                              <span className="text-[10px] text-zinc-500 mt-2">2nd bridge</span>
                            </div>
                            <div className="text-center">
                              <div className="w-14 h-14 rounded-full bg-purple-500/10 border-2 border-purple-400 flex items-center justify-center mx-auto mb-3">
                                <User className="w-6 h-6 text-purple-300" />
                              </div>
                              <p className="text-sm font-medium text-white">{(bestContact as any).bridge2.name.split(" ")[0]}</p>
                              <p className="text-xs text-purple-300">2nd-degree bridge</p>
                            </div>
                          </>
                        )}
                        <div className="flex-1 max-w-[80px] flex flex-col items-center">
                          <div className="h-0.5 w-full bg-gradient-to-r from-purple-500 to-accent-cyan rounded-full" />
                          <span className="text-[10px] text-zinc-500 mt-2">{bestContact.degree === 1 ? "1st degree" : "referral"}</span>
                        </div>
                        <div className="text-center">
                          <div className="w-14 h-14 rounded-full bg-accent-emerald/20 border-2 border-accent-emerald flex items-center justify-center mx-auto mb-3">
                            <User className="w-6 h-6 text-accent-emerald" />
                          </div>
                          <p className="text-sm font-medium text-white">{bestContact.name.split(" ")[0]}</p>
                          <p className="text-xs text-accent-emerald">{(bestContact.title || "").split(" ").slice(0,2).join(" ")}</p>
                        </div>
                        <div className="flex-1 max-w-[80px] flex flex-col items-center">
                          <div className="h-0.5 w-full bg-gradient-to-r from-accent-emerald to-accent-cyan rounded-full" />
                        </div>
                        <div className="text-center">
                          <div className="w-14 h-14 rounded-full bg-accent-cyan/20 border-2 border-accent-cyan flex items-center justify-center mx-auto mb-3">
                            <Building2 className="w-6 h-6 text-accent-cyan" />
                          </div>
                          <p className="text-sm font-medium text-white">{results.company}</p>
                          <p className="text-xs text-accent-cyan">Target</p>
                        </div>
                      </div>
                      <div className="mt-6 pt-6 border-t border-dark-glassBorder">
                        <p className="text-sm text-zinc-400 text-center">
                          {bestContact.is_recruiter
                            ? "Recruiter at the company"
                            : `${bestContact.degree === 1 ? "Direct" : `${bestContact.degree}rd-degree`} connection at ${results.company}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {results.recruiters?.length > 0 && (
                  <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Sparkles className="w-5 h-5 text-accent-amber" />
                      <h2 className="text-lg font-semibold text-white">Recruiters at {results.company}</h2>
                    </div>
                    <div className="space-y-4">
                      {results.recruiters.map((contact, idx) => (
                        <ContactRow key={`r-${idx}`} contact={contact} onDraftMessage={() => generateMessage(contact)} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-accent-amber" />
                    <h2 className="text-lg font-semibold text-white">Recommended Contacts</h2>
                  </div>
                  <div className="space-y-4">
                    {results.top_connections.map((contact, idx) => (
                      <ContactRow key={`c-${idx}`} contact={contact} onDraftMessage={() => generateMessage(contact)} />
                    ))}
                    {results.top_connections.length === 0 && (
                      <p className="text-zinc-500 text-center py-8">No connections found at this company.</p>
                    )}
                  </div>
                  
                  {results.total_connections > pageSize && (
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-dark-glassBorder">
                      <div className="flex items-center gap-4">
                        <button 
                          disabled={searchPage === 1 || loading}
                          onClick={() => search(searchPage - 1)}
                          className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                        >
                          <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        <span className="text-sm text-zinc-500 font-medium whitespace-nowrap">
                          Page {searchPage} of {Math.ceil(results.total_connections / pageSize)}
                        </span>
                        <button 
                          disabled={searchPage >= Math.ceil(results.total_connections / pageSize) || loading}
                          onClick={() => search(searchPage + 1)}
                          className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                        >
                          Next <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-zinc-500 hidden sm:block">
                        Total {results.total_connections} found
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-accent-cyan" />
                    <h3 className="text-lg font-semibold text-white">AI Message</h3>
                  </div>
                  {selectedContact ? (
                    <>
                      <p className="text-sm text-zinc-400 mb-3">Message for <span className="text-white">{selectedContact.name}</span></p>
                      {messageLoading ? (
                        <div className="bg-dark-bg/80 rounded-xl p-4 border border-dark-glassBorder h-40 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-brand-400 mx-auto" />
                        </div>
                      ) : aiMessage ? (
                        <>
                          <textarea
                            value={aiMessage}
                            onChange={e => setAiMessage(e.target.value)}
                            rows={7}
                            className="w-full bg-dark-bg/80 rounded-xl p-4 mb-4 border border-dark-glassBorder text-sm text-zinc-300 leading-relaxed focus:outline-none focus:border-brand-500 resize-none transition-colors"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleCopy}
                              className={`flex-1 text-sm py-2.5 rounded-xl font-medium transition-all inline-flex items-center justify-center gap-2 ${copiedMessage ? "bg-accent-emerald text-white" : "bg-brand-600 hover:bg-brand-500 text-white"}`}
                            >
                              {copiedMessage ? (<><CheckCircle2 className="w-4 h-4" />Copied!</>) : (<><Copy className="w-4 h-4" />Copy</>)}
                            </button>
                            <button
                              onClick={() => {
                                if (selectedContact?.email) {
                                  window.location.href = `mailto:${selectedContact.email}?subject=${encodeURIComponent("Quick Coffee Chat?")}&body=${encodeURIComponent(aiMessage)}`
                                  setEmailError(false)
                                  logOutreach("email")
                                } else {
                                  setEmailError(true)
                                }
                              }}
                              className="border border-dark-glassBorder hover:border-zinc-500 text-zinc-400 hover:text-white text-sm px-4 py-2.5 rounded-xl font-medium transition-all inline-flex items-center justify-center gap-2"
                            >
                              <Mail className="w-4 h-4" />Send Email
                            </button>
                          </div>
                          {selectedContact.profile_url && (
                            <button
                              onClick={async () => {
                                // Log the LinkedIn visit
                                try {
                                  const axios = await getAuthAxios()
                                  await axios.post("/api/messages/visit", {
                                    person_id: selectedContact.id || selectedContact.name,
                                    person_name: selectedContact.name,
                                    company_name: query
                                  })
                                } catch (e) {
                                  console.error("Failed to log LinkedIn visit:", e)
                                }
                                window.open(selectedContact.profile_url, "_blank", "noopener,noreferrer")
                              }}
                              className="w-full mt-2 bg-[#0A66C2] hover:bg-[#0A66C2]/80 text-white text-sm py-2.5 rounded-xl font-medium transition-all inline-flex items-center justify-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View LinkedIn Profile
                            </button>
                          )}
                          {emailError && (
                            <p className="mt-2 text-xs text-accent-rose text-center">
                              Email could not be found, copy this message to send directly.
                            </p>
                          )}
                        </>
                      ) : (
                        <button onClick={() => generateMessage(selectedContact)} className="w-full bg-brand-600 hover:bg-brand-500 text-white text-sm py-3 rounded-xl font-medium transition-all inline-flex items-center justify-center gap-2">
                          Generate Outreach Message
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-zinc-500 text-center py-8">Search a company and click &quot;Draft Message&quot; to generate an AI outreach message.</p>
                  )}
                  <p className="text-xs text-zinc-500 text-center mt-3">Powered by Gemini</p>
                </div>
              </div>
            </div>
          )}

          {!results && !loading && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-dark-surface border border-dark-glassBorder flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-400 mb-2">Search for a company</h3>
              <p className="text-zinc-500 text-sm">Enter a company name above to find your warmest paths in.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-dark-bg items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  )
}

function ContactRow({ contact, onDraftMessage }: { contact: Contact; onDraftMessage: () => void }) {
  return (
    <div className="p-4 rounded-xl bg-dark-bg/50 border border-dark-glassBorder hover:border-brand-500/30 transition-all group">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-dark-elevated flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-semibold text-white">{contact.name}</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-dark-elevated text-zinc-500 border border-dark-glassBorder">
                {contact.degree === 1 ? "1st" : contact.degree === 2 ? "2nd" : "3rd"}°
              </span>
              {contact.is_recruiter && <span className="text-xs px-2 py-0.5 rounded-full bg-accent-amber/10 text-accent-amber border border-accent-amber/20">Recruiter</span>}
            </div>
            <p className="text-sm text-zinc-400 mb-1">{contact.title || "Unknown role"}</p>

            {/* Email */}
            <div className="flex items-center gap-1.5 mb-1">
              <Mail className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="text-xs text-brand-400 hover:text-brand-300 transition-colors truncate">
                  {contact.email}
                </a>
              ) : (
                <span className="text-xs text-zinc-600 italic">No email available</span>
              )}
            </div>

            {/* LinkedIn */}
            {contact.profile_url && (
              <a
                href={contact.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#0A66C2] hover:text-[#0A66C2]/80 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                LinkedIn Profile
              </a>
            )}

            {contact.degree === 2 && contact.bridge && (
              <p className="text-xs text-zinc-600 mt-1">Via {contact.bridge.name}</p>
            )}
            {contact.degree === 3 && contact.bridge && (contact as any).bridge2 && (
              <p className="text-xs text-zinc-600 mt-1">
                Via {contact.bridge.name} → {(contact as any).bridge2.name}
              </p>
            )}
          </div>
        </div>
        <button onClick={onDraftMessage} className="btn-primary text-sm px-4 py-2 flex-shrink-0">
          Draft Message<ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
