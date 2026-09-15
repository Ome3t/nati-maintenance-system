import { Sidebar } from "@/components/shared/sidebar"
import { Topbar } from "@/components/shared/topbar"
import { getCurrentUser } from "@/lib/mock-session"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  const safeUser = user || { id: "1", fullName: "Manager", role: "MANAGER" }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#09090b]">
      {/* Sidebar: Fixed width, never shrinks */}
      <div className="w-[260px] shrink-0 border-r border-white/5 bg-[#09090b]">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={safeUser} title="Nati Maintenance" />
        <main className="flex-1 overflow-y-auto p-8 bg-[#09090b]">
          {children}
        </main>
      </div>
    </div>
  )
}