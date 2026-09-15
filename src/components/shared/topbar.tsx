import { Button } from "@/components/ui/button"
import type { CurrentUser } from "@/lib/mock-session"

export function Topbar({ user, title }: { user: CurrentUser; title: string }) {
  return (
    <header className="h-14 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between px-6">
      <h1 className="text-sm font-medium text-[var(--color-text)]">{title}</h1>

      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <div className="text-sm text-[var(--color-text)]">{user.fullName}</div>
          <div className="text-xs text-[var(--color-text-muted)] capitalize">
            {user.role.toLowerCase()}
          </div>
        </div>
        {/* TODO: wire this to Better Auth's signOut() once login is ready */}
        <form action="/api/auth/signout" method="post">
          <Button variant="outline" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  )
}