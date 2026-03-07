"use client"
import { useSearchParams, usePathname } from "next/navigation"
import { Waypoints, Sparkles, MessageSquare, Copy, Volume2, Share2, Ghost, ChevronLeft, User, Building2, ArrowRight, CheckCircle2, Home, Users, Upload, Search, Settings } from "lucide-react"
import Link from "next/link"
import { Suspense, useState } from "react"

const navItems = [
  { icon: Home, href: "/dashboard", label: "Dashboard" },
  { icon: Users, href: "/connections", label: "Connections" },
  { icon: Upload, href: "/upload", label: "Upload" },
  { icon: Search, href: "/search", label: "Search" },
]

function SearchResultsContent() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const query = searchParams.get("q") || "Google"
  const [copiedMessage, setCopiedMessage] = useState(false)

  const contacts = [
    { 
      name: "Sarah Jenkins", 
      role: "Senior Software Engineer", 
      company: query,
      match: 98, 
      degree: "1st",
      rationale: "Worked together at your previous company. High response rate in your network." 
    },
    { 
      name: "David Chen", 
      role: "Engineering Manager", 
      company: query,
      match: 85, 
      degree: "1st",
      rationale: "Active in your alumni network. Currently hiring for your target role." 
    },
    { 
      name: "Priya Patel", 
      role: "Technical Recruiter", 
      company: query,
      match: 72, 
      degree: "2nd",
      rationale: "Connected via Sarah. Specializes in frontend and full-stack roles." 
    },
  ]

  const handleCopy = () => {
    setCopiedMessage(true)
    setTimeout(() => setCopiedMessage(false), 2000)
  }

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <aside className="w-20 bg-dark-surface border-r border-dark-glassBorder flex flex-col items-center py-6 gap-2">
        <Link href="/" className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center mb-8 shadow-glow">
          <Waypoints className="w-6 h-6 text-white" />
        </Link>

        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/search" && pathname.startsWith("/search"))
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
        <div className="max-w-5xl mx-auto animate-fade-in">
          <div className="mb-8">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Paths to {query}
                </h1>
                <p className="text-zinc-400">
                  Found <span className="text-white font-medium">12 connections</span>, 
                  <span className="text-white font-medium"> 3 warm paths</span>, and 
                  <span className="text-white font-medium"> 2 active roles</span>
                </p>
              </div>
              
              <button className="btn-secondary text-sm">
                <Share2 className="w-4 h-4" />
                Share Results
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
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

                    <div className="flex-1 max-w-[80px] flex flex-col items-center">
                      <div className="h-0.5 w-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full" />
                      <span className="text-[10px] text-zinc-500 mt-2">1st degree</span>
                    </div>

                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center mx-auto mb-3">
                        <User className="w-6 h-6 text-purple-400" />
                      </div>
                      <p className="text-sm font-medium text-white">Sarah J.</p>
                      <p className="text-xs text-purple-400">Engineer</p>
                    </div>

                    <div className="flex-1 max-w-[80px] flex flex-col items-center">
                      <div className="h-0.5 w-full bg-gradient-to-r from-purple-500 to-accent-cyan rounded-full" />
                      <span className="text-[10px] text-zinc-500 mt-2">referral</span>
                    </div>

                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full bg-accent-cyan/20 border-2 border-accent-cyan flex items-center justify-center mx-auto mb-3">
                        <Building2 className="w-6 h-6 text-accent-cyan" />
                      </div>
                      <p className="text-sm font-medium text-white">{query}</p>
                      <p className="text-xs text-accent-cyan">Target</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-dark-glassBorder">
                    <p className="text-sm text-zinc-400 text-center">
                      <span className="text-accent-emerald font-medium">98% match</span> — Sarah has successfully referred 3 people to {query} this year
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-accent-amber" />
                  <h2 className="text-lg font-semibold text-white">Recommended Contacts</h2>
                </div>

                <div className="space-y-4">
                  {contacts.map((contact, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 rounded-xl bg-dark-bg/50 border border-dark-glassBorder hover:border-brand-500/30 transition-all group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full bg-dark-elevated flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-zinc-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-white">{contact.name}</h4>
                              <span className={`badge text-xs ${
                                contact.match >= 90 
                                  ? "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20" 
                                  : contact.match >= 80
                                    ? "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                                    : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                              }`}>
                                {contact.match}% match
                              </span>
                              <span className="badge bg-dark-elevated text-zinc-500 border border-dark-glassBorder text-xs">
                                {contact.degree}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-400 mb-2">
                              {contact.role} at {contact.company}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {contact.rationale}
                            </p>
                          </div>
                        </div>
                        
                        <button className="btn-primary text-sm px-4 py-2 flex-shrink-0">
                          Draft Message
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-accent-cyan" />
                  <h3 className="text-lg font-semibold text-white">AI Message</h3>
                </div>
                
                <div className="bg-dark-bg/80 rounded-xl p-4 mb-4 border border-dark-glassBorder">
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    &quot;Hi Sarah! Hope you&apos;re doing well. I noticed {query} has some exciting openings and remembered how great it was working with you at [Previous Company]. Would you be open to a quick chat about your experience there? I&apos;d love to hear your insights.&quot;
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handleCopy}
                    className={`flex-1 text-sm py-2.5 rounded-xl font-medium transition-all inline-flex items-center justify-center gap-2 ${
                      copiedMessage 
                        ? "bg-accent-emerald text-white" 
                        : "bg-brand-600 hover:bg-brand-500 text-white"
                    }`}
                  >
                    {copiedMessage ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                  <button 
                    className="btn-secondary text-sm px-4 py-2.5"
                    title="Generate audio pitch with ElevenLabs"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-zinc-500 text-center mt-3">
                  Powered by Gemini AI
                </p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Ghost className="w-5 h-5 text-accent-amber" />
                  <h3 className="text-lg font-semibold text-white">Ghost Job Check</h3>
                </div>
                
                <p className="text-sm text-zinc-400 mb-4">
                  Analyzed 3 open roles at {query}
                </p>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-accent-emerald/10 border border-accent-emerald/20">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent-emerald mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-accent-emerald">Frontend Engineer</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Likely active — 2 connections know the hiring manager</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-accent-amber/10 border border-accent-amber/20">
                    <div className="flex items-start gap-2">
                      <Ghost className="w-4 h-4 text-accent-amber mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-accent-amber">Senior React Dev</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Warning — Reposted 4x in 60 days, no team connections</p>
                      </div>
                    </div>
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

export default function SearchResults() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-dark-bg">
        <aside className="w-20 bg-dark-surface border-r border-dark-glassBorder" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Finding your warmest paths...</p>
          </div>
        </main>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  )
}
