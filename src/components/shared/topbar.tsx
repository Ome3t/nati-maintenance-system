"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  Bell, Search, X, CheckCircle2, AlertCircle, Menu, LogOut, ChevronDown,
  LayoutDashboard, ShoppingCart, Briefcase, Settings, Wrench, DollarSign, Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

/* Fallback destinations for old notifications that have no stored link */
const fallbackLink = (type: string) => {
  switch (type) {
    case "PAYMENT_RECEIVED": return "/sales-history";
    case "JOB_READY": return "/pos";
    case "JOB_ASSIGNED":
    case "JOB_TRANSFERRED": return "/my-jobs";
    case "LOW_STOCK": return "/inventory";
    default: return "/";
  }
};

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user as any;
  const fullName = user?.name || user?.email?.split("@")[0] || "User";
  const userRole = user?.role || "TECHNICIAN";
  const userEmail = user?.email || "";

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  /* ✅ Hardened fetch: silent retry on network failures (dev server restarting,
     laptop sleeping, etc.) instead of spamming console errors */
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Server unreachable right now — the next poll (30s) will retry automatically
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session?.user]);

  const handleOpenNotifications = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markAllAsRead: true }),
        });
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch {
        // silent: badge will correct itself on next poll
      }
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setShowUserMenu(false);
  }, [pathname]);

  const getCurrentPageName = () => {
    if (pathname === "/manager" || pathname === "/manager/") return "Overview";
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    return lastSegment ? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1) : "Dashboard";
  };

  const currentPage = getCurrentPageName();

  const roleHome =
    userRole === "OWNER"
      ? { label: "Dashboard", href: "/manager", icon: LayoutDashboard }
      : userRole === "CASHIER"
      ? { label: "Point of Sale", href: "/pos", icon: ShoppingCart }
      : { label: "My Jobs", href: "/my-jobs", icon: Briefcase };

  const allNavLinks = [
    { name: "Dashboard", href: "/manager", roles: ["OWNER"] },
    { name: "Customers", href: "/manager/customers", roles: ["OWNER"] },
    { name: "All Jobs", href: "/jobs", roles: ["OWNER"] },
    { name: "Payments", href: "/manager/payments", roles: ["OWNER"] },
    { name: "Reports", href: "/manager/reports", roles: ["OWNER"] },
    { name: "Inventory", href: "/inventory", roles: ["OWNER"] },
    { name: "Expenses", href: "/expenses", roles: ["OWNER"] },
    { name: "POS", href: "/pos", roles: ["CASHIER", "OWNER"] },
    { name: "Sales History", href: "/sales-history", roles: ["CASHIER", "OWNER"] },
    { name: "My Jobs", href: "/my-jobs", roles: ["TECHNICIAN", "OWNER"] },
    { name: "Pending Payments", href: "/pending-payments", roles: ["TECHNICIAN", "OWNER"] },
    { name: "Settings", href: "/manager/settings", roles: ["OWNER"] },
  ];

  const navLinks = allNavLinks.filter((link) => link.roles.includes(userRole));

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "JOB_READY": return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
      case "JOB_WAITING_PARTS": return <Package className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
      case "PAYMENT_RECEIVED": return <DollarSign className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
      case "JOB_ASSIGNED": return <Wrench className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />;
      case "JOB_TRANSFERRED": return <Wrench className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />;
      case "LOW_STOCK": return <Package className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />;
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

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
            onClick={handleOpenNotifications}
            className="relative p-2 rounded-full hover:bg-accent transition-colors"
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-card shadow-xl z-50 overflow-hidden animate-dropdown-enter">
              <div className="p-3 border-b border-border flex justify-between items-center bg-muted/30">
                <span className="text-sm font-semibold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href={notification.link || fallbackLink(notification.type)}
                      onClick={() => setShowNotifications(false)}
                      className={cn(
                        "block p-3 border-b border-border hover:bg-accent/50 cursor-pointer transition-colors",
                        !notification.read && "bg-primary/5"
                      )}
                    >
                      <div className="flex gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1.5">{timeAgo(notification.createdAt)}</p>
                        </div>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                    </Link>
                  ))
                )}
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
                const isActive = pathname === link.href;
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
                );
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}