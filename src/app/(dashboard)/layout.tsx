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
}