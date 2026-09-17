<<<<<<< HEAD
import { Sidebar } from "@/components/shared/sidebar"
import { Topbar } from "@/components/shared/topbar"
import { ScrollProgress } from "@/components/shared/scroll-progress" // <-- ADD THIS

import { CommandPaletteWrapper } from "@/components/shared/command-palette-wrapper" // <-- ADD THIS
import { getCurrentUser } from "@/lib/mock-session"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  const safeUser = user || { id: "1", fullName: "Manager", role: "MANAGER" }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="hidden lg:flex w-[260px] shrink-0 border-r border-border bg-background">
        <Sidebar />
      </div>
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={safeUser} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
          {children}
        </main>
      </div>

      <CommandPaletteWrapper />
      <ScrollProgress /> {/* <-- ADD THIS */}
    </div>
  )
=======
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingCart,
  Wrench,
  Package,
  Users,
  CreditCard,
  Receipt,
  BarChart3,
  LogOut,
  Bell,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const router = useRouter();

  const role = session?.user?.role;

  const ownerNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "POS", href: "/pos", icon: ShoppingCart },
    { name: "Jobs", href: "/jobs", icon: Wrench },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];

  const cashierNavigation = [
    { name: "POS", href: "/pos", icon: ShoppingCart },
    { name: "Jobs", href: "/jobs", icon: Wrench },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Payments", href: "/payments", icon: CreditCard },
  ];

  const technicianNavigation = [
    { name: "My Jobs", href: "/my-jobs", icon: Wrench },
  ];

  const navigation = 
    role === "OWNER" ? ownerNavigation :
    role === "CASHIER" ? cashierNavigation :
    technicianNavigation;

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-screen">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-900">Nati Maintenance</h1>
          <p className="text-sm text-gray-500">{role}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {session?.user?.name}
          </h2>
          <button className="relative p-2 text-gray-400 hover:text-gray-500">
            <Bell className="h-6 w-6" />
          </button>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
>>>>>>> main
}