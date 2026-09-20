"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import {
  Bell, Search, X, CheckCircle2, AlertCircle, Menu, LogOut, ChevronDown,
  LayoutDashboard, ShoppingCart, Briefcase, Settings,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function Topbar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const user = session?.user as any
  const fullName = user?.name || user?.email?.split("@")[0] || "User"
  const userRole = user?.role || "TECHNICIAN"
  const userEmail = user?.email || ""

  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close user menu when navigating
  useEffect(() => {
    setShowUserMenu(false)
  }, [pathname])

  const getCurrentPageName = () => {
    if (pathname === "/manager" || pathname === "/manager/") return "Overview"
    const segments = pathname.split("/").filter(Boolean)
    const lastSegment = segments[segments.length - 1]
    return lastSegment ? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1) : "Dashboard"
  }

  const currentPage = getCurrentPageName()

  // Role-aware quick link in the dropdown
  const roleHome =
    userRole === "OWNER"
      ? { label: "Dashboard", href: "/manager", icon: LayoutDashboard }
      : userRole === "CASHIER"
      ? { label: "Point of Sale", href: "/pos", icon: ShoppingCart }
      : { label: "My Jobs", href: "/my-jobs", icon: Briefcase }

      const allNavLinks = [
        // OWNER
        { name: "Dashboard", href: "/manager", roles: ["OWNER"] },
        { name: "Customers", href: "/manager/customers", roles: ["OWNER"] },
        { name: "All Jobs", href: "/jobs", roles: ["OWNER"] },
        { name: "Payments", href: "/manager/payments", roles: ["OWNER"] },
        { name: "Reports", href: "/manager/reports", roles: ["OWNER"] },
        { name: "Inventory", href: "/inventory", roles: ["OWNER"] },
        { name: "Expenses", href: "/expenses", roles: ["OWNER"] },
        // CASHIER
        { name: "POS", href: "/pos", roles: ["CASHIER", "OWNER"] },
        { name: "Sales History", href: "/sales-history", roles: ["CASHIER", "OWNER"] },
        // TECHNICIAN
        { name: "My Jobs", href: "/my-jobs", roles: ["TECHNICIAN", "OWNER"] },
        { name: "Pending Payments", href: "/pending-payments", roles: ["TECHNICIAN", "OWNER"] },
        // OWNER settings
        { name: "Settings", href: "/manager/settings", roles: ["OWNER"] },
      ]
    
      // Only show links this role is allowed to see
      const navLinks = allNavLinks.filter((link) => link.roles.includes(userRole))
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

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-full hover:bg-accent transition-colors"
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-card shadow-xl z-50 overflow-hidden animate-dropdown-enter">
              <div className="p-3 border-b border-border flex justify-between items-center bg-muted/30">
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

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 md:gap-3 border-l border-border pl-2 md:pl-3 ml-1 py-1 rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-foreground">{fullName}</div>
              <div className="text-xs text-muted-foreground capitalize">{userRole}</div>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", showUserMenu && "rotate-180")} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg border border-border bg-card shadow-xl z-50 overflow-hidden animate-dropdown-enter">
              {/* Profile header */}
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                    {fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{userEmail || "No email"}</p>
                  </div>
                </div>
                <span className="inline-flex items-center mt-2 rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                  {userRole}
                </span>
              </div>

              {/* Quick links */}
              <div className="p-1.5">
                <Link
                  href={roleHome.href}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent/50 transition-colors"
                >
                  <roleHome.icon className="h-4 w-4 text-muted-foreground" />
                  {roleHome.label}
                </Link>
                {userRole === "OWNER" && (
                  <Link
                    href="/manager/settings"
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent/50 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Settings
                  </Link>
                )}
              </div>

              {/* Sign out */}
              <div className="p-1.5 border-t border-border">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* The little sign-out button stays! */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 rounded-full hover:bg-red-500/10 hover:text-red-500 text-muted-foreground transition-colors"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <div className="flex flex-col h-full bg-background">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-foreground">Nati<span className="text-primary">.</span></h1>
                <p className="text-xs text-primary mt-1 capitalize font-medium">{userRole} Dashboard</p>
              </div>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-muted-foreground hover:text-red-500 transition-colors">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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