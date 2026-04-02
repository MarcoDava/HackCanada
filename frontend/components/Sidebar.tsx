"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Waypoints, Home, Users, Upload, Search, GitGraph, LogOut, UserPlus } from "lucide-react"
import { useAuth } from "./AuthContext"

const navItems = [
  { icon: Home, href: "/dashboard", label: "Dashboard" },
  { icon: Search, href: "/search", label: "Search" },
  { icon: Users, href: "/connections", label: "Connections" },
  { icon: GitGraph, href: "/graph", label: "Graph" },
  { icon: Upload, href: "/upload", label: "Upload" },
  { icon: UserPlus, href: "/expand-network", label: "Expand" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-20 bg-dark-surface border-r border-dark-glassBorder flex-col items-center py-6 gap-2 shrink-0">
        <Link href="/" className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center mb-8 shadow-glow">
          <Waypoints className="w-6 h-6 text-white" />
        </Link>

        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/search" && pathname.startsWith("/search"))
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

        <div className="flex flex-col gap-2 mt-auto">
          <button
            onClick={logout}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border border-dark-glassBorder bg-gradient-to-br from-accent-amber to-accent-rose">
            {user?.picture ? (
              <img src={user.picture} alt={user.name || "User"} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden bg-dark-surface/95 backdrop-blur-md border-t border-dark-glassBorder">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/search" && pathname.startsWith("/search"))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all ${
                isActive ? "text-brand-400" : "text-zinc-500"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={logout}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-zinc-500"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-medium">Sign Out</span>
        </button>
      </nav>
    </>
  )
}
