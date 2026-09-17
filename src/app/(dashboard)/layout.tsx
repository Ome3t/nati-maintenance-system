"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Wrench,
  CreditCard,
  Receipt,
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const role = session?.user?.role;

  const ownerNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Jobs", href: "/jobs", icon: Wrench },
    { name: "POS", href: "/pos", icon: ShoppingCart },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Cashier: only payment-related pages
  const cashierNavigation = [
  { name: "Pending Payments", href: "/pending-payments", icon: CreditCard },
  { name: "POS", href: "/pos", icon: ShoppingCart },
  { name: "Sales History", href: "/sales-history", icon: Receipt },
  { name: "Payments", href: "/payments", icon: Receipt },
];

  // Technician: only jobs they can create + manage
  const technicianNavigation = [
    { name: "My Jobs", href: "/my-jobs", icon: Wrench },
    { name: "Create Job", href: "/jobs/new", icon: Plus },
  ];

  const navigation =
    role === "OWNER" ? ownerNavigation :
    role === "CASHIER" ? cashierNavigation :
    technicianNavigation;

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-60 bg-white border-r border-slate-200 flex flex-col fixed h-screen">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">N</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">Nati Repair</h1>
              <p className="text-xs text-slate-500 capitalize">
                {role?.toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-60">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-end sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">
                {session?.user?.name}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {role?.toLowerCase()}
              </p>
            </div>
            <div className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {getInitials(session?.user?.name)}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-2 px-3 py-1.5 text-sm border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}