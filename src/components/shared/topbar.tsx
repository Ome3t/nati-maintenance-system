"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Bell, Search, X, CheckCircle2, AlertCircle, Menu } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface TopbarProps {
  user: { fullName: string; role: string }
}

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname()
  const [showNotifications, setShowNotifications] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const getCurrentPageName = () => {
    if (pathname === "/manager" || pathname === "/manager/") return "Overview"
    const segments = pathname.split("/").filter(Boolean)
    const lastSegment = segments[segments.length - 1]
    return lastSegment ? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1) : "Dashboard"
  }

  const currentPage = getCurrentPageName()

  const navLinks = [
    { name: "Dashboard", href: "/manager" },
    { name: "Customers", href: "/manager/customers" },
    { name: "Jobs", href: "/manager/jobs" },
    { name: "Payments", href: "/manager/payments" },
    { name: "Reports", href: "/manager/reports" },
    { name: "Settings", href: "/manager/settings" },
  ]

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      {/* Left: Hamburger & Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <button 
          onClick={() => setMobileMenuOpen(true)} 
          className="lg:hidden p-2 -ml-2 rounded-md hover:bg-accent text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>

        <span className="font-bold text-foreground">Nati Maintenance</span>
        <span className="text-muted-foreground hidden sm:inline">/</span>
        <span className="text-muted-foreground font-medium hidden sm:inline">{currentPage}</span>
      </div>

      {/* Right: Search, Notifications, Theme Toggle, User */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search...(⌘K)"
            className="h-8 w-64 pl-9 bg-muted/50 border-border text-sm"
          />
        </div>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-full hover:bg-accent transition-colors"
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          </button>

          {showNotifications && (
  <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-card shadow-xl z-50 overflow-hidden animate-dropdown-enter">              <div className="p-3 border-b border-border flex justify-between items-center bg-muted/30">
                <span className="text-sm font-semibold text-foreground">Notifications</span>
                <button onClick={() => setShowNotifications(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                <div className="p-3 border-b border-border hover:bg-accent/50 cursor-pointer transition-colors">
                  <div className="flex gap-3">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Job awaiting parts</p>
                      <p className="text-xs text-muted-foreground mt-1">Job #1041 (Dell Latitude) has been waiting for 24h.</p>
                      <p className="text-xs text-muted-foreground mt-1.5">2 hours ago</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 hover:bg-accent/50 cursor-pointer transition-colors">
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Payment received</p>
                      <p className="text-xs text-muted-foreground mt-1">1,200 ETB collected for Job #1040 by Meron K.</p>
                      <p className="text-xs text-muted-foreground mt-1.5">5 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <ThemeToggle />

        <div className="flex items-center gap-3 border-l border-border pl-2 md:pl-3 ml-1">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-foreground">{user.fullName}</div>
            <div className="text-xs text-muted-foreground">{user.role}</div>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
            {user.fullName.charAt(0)}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <div className="flex flex-col h-full bg-background">
            <div className="p-6 border-b border-border">
              <h1 className="text-xl font-bold text-foreground">Nati<span className="text-primary">.</span></h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {link.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}