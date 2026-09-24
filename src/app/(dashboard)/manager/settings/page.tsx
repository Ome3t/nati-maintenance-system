"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Panel } from "@/components/shared/panel"
import { RoleBadge } from "@/components/shared/role-badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, Users, Settings2, Plus, Save, RefreshCw, Loader2, X, Trash2, Eye, EyeOff, ShieldCheck, Pencil, Lock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string
  email: string
  phone?: string | null
  role: "OWNER" | "CASHIER" | "TECHNICIAN"
  isActive: boolean
  createdAt: string
}

interface BusinessProfile {
  businessName: string
  phone?: string | null
  email?: string | null
  taxId?: string | null
  address?: string | null
}

interface Preferences {
  autoGenerateReceipts: boolean
  allowPartialPayments: boolean
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const currentUserId = (session?.user as any)?.id

  const [users, setUsers] = useState<User[]>([])
  const [masterOwnerId, setMasterOwnerId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Add User Modal State
  const [showAddUser, setShowAddUser] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "TECHNICIAN" as "OWNER" | "CASHIER" | "TECHNICIAN",
    phone: ""
  })

  // Edit User Modal State
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "TECHNICIAN" as User["role"], password: "" })
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; user: User | null }>({ show: false, user: null })
  const [isDeleting, setIsDeleting] = useState(false)

  // System Reset State (master only)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState("")
  const [isResetting, setIsResetting] = useState(false)

  // Business Profile State
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Preferences State
  const [preferences, setPreferences] = useState<Preferences>({
    autoGenerateReceipts: true,
    allowPartialPayments: true,
  })
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)

  // --- REAL-TIME DATA FETCHING ---
  const fetchUsers = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      const data = await res.json()
      setUsers(Array.isArray(data.users) ? data.users : [])
      setMasterOwnerId(data.masterOwnerId ?? null)
    } catch (error) {
      toast.error("Failed to load staff members")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/settings/business-profile")
      if (!res.ok) throw new Error("Failed to fetch profile")
      const data = await res.json()
      setProfile(data)
    } catch (error) {
      toast.error("Failed to load business profile")
    }
  }

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/settings/preferences")
      if (!res.ok) throw new Error("Failed to fetch preferences")
      const data = await res.json()
      setPreferences(data)
    } catch (error) {
      console.error("Failed to load preferences", error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchProfile()
    fetchPreferences()
  }, [])

  // --- REAL-TIME ACTIONS ---
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create user")
      }

      toast.success(`${newUser.name} added successfully! They can now log in with their credentials.`)
      setShowAddUser(false)
      setNewUser({ name: "", email: "", password: "", role: "TECHNICIAN", phone: "" })
      setShowPassword(false)
      fetchUsers(true)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEdit = (user: User) => {
    setEditTarget(user)
    setEditForm({ name: user.name, email: user.email, role: user.role, password: "" })
    setShowEditPassword(false)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setIsSavingEdit(true)

    const isMaster = editTarget.id === masterOwnerId
    const payload: any = {
      name: editForm.name,
      email: editForm.email,
    }
    if (!isMaster) payload.role = editForm.role
    if (editForm.password) payload.password = editForm.password

    try {
      const res = await fetch(`/api/users/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update user")
      }

      toast.success(`${editForm.name}'s details updated successfully`)
      setEditTarget(null)
      fetchUsers(true)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const toggleUserStatus = async (user: User) => {
    if (user.id === currentUserId) {
      toast.error("You cannot disable your own account")
      return
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update status")
      }

      toast.success(`${user.name}'s status updated to ${!user.isActive ? 'Active' : 'Inactive'}`)
      fetchUsers(true)
    } catch (error: any) {
      toast.error(error.message || "Failed to update user status")
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteConfirm.user) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/users/${deleteConfirm.user.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete user")
      }

      toast.success(`${deleteConfirm.user.name} has been deleted successfully`)
      setDeleteConfirm({ show: false, user: null })
      fetchUsers(true)
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSystemReset = async () => {
    setIsResetting(true)
    try {
      const res = await fetch("/api/system/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "RESET" }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to reset system")
      }

      toast.success("System reset complete", {
        description: "All business data has been erased. The system is now clean.",
      })
      setShowResetModal(false)
      setResetConfirmText("")
      fetchUsers(true)
      fetchProfile()
      fetchPreferences()
    } catch (error: any) {
      toast.error(error.message || "Failed to reset system")
    } finally {
      setIsResetting(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      const data = Object.fromEntries(formData.entries())

      const res = await fetch("/api/settings/business-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error("Failed")
      toast.success("Business profile updated successfully")
      fetchProfile()
    } catch {
      toast.error("Failed to save business profile")
    } finally {
      setIsSavingProfile(false)
    }
  }

  const togglePreference = async (key: keyof Preferences) => {
    const newValue = !preferences[key]
    setPreferences(prev => ({ ...prev, [key]: newValue }))
    setIsSavingPreferences(true)

    try {
      const res = await fetch("/api/settings/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: newValue }),
      })

      if (!res.ok) {
        setPreferences(prev => ({ ...prev, [key]: !newValue }))
        throw new Error("Failed")
      }
      toast.success(`${key === 'autoGenerateReceipts' ? 'Auto-generate Receipts' : 'Partial Payments'} ${newValue ? 'enabled' : 'disabled'}`)
    } catch {
      toast.error("Failed to update setting")
    } finally {
      setIsSavingPreferences(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <RefreshCw className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your business profile, staff, and system preferences.</p>
        </div>
        <button
          onClick={() => fetchUsers(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-lg bg-card border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Business Profile */}
      <Panel title="Business Profile" action={<Building2 className="h-4 w-4 text-muted-foreground" />}>
        {!profile ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Business Name</label>
              <Input name="businessName" defaultValue={profile.businessName} className="bg-muted/50 border-border text-foreground" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone Number</label>
              <Input name="phone" defaultValue={profile.phone || ""} className="bg-muted/50 border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</label>
              <Input name="email" defaultValue={profile.email || ""} className="bg-muted/50 border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tax ID (Optional)</label>
              <Input name="taxId" defaultValue={profile.taxId || ""} className="bg-muted/50 border-border text-foreground" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Physical Address</label>
              <Input name="address" defaultValue={profile.address || ""} className="bg-muted/50 border-border text-foreground" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button
                type="submit"
                disabled={isSavingProfile}
                className="bg-emerald-600 hover:bg-emerald-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSavingProfile ? (<><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving...</>) : (<><Save className="h-4 w-4 mr-2" /> Save Changes</>)}
              </Button>
            </div>
          </form>
        )}
      </Panel>

      {/* Staff Management */}
      <Panel title="Staff Management" action={
        <Button size="sm" onClick={() => setShowAddUser(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Plus className="h-3 w-3 mr-2" /> Add User
        </Button>
      }>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Joined</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No staff members found.</TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const isMaster = user.id === masterOwnerId
                  const isSelf = user.id === currentUserId
                  return (
                    <TableRow key={user.id} className="border-border/50 hover:bg-accent/50 transition-colors">
                      <TableCell className="font-medium text-foreground">
                        <span className="flex items-center gap-2">
                          {user.name}
                          {isSelf && (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                              You
                            </span>
                          )}
                          {isMaster && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                              <ShieldCheck className="h-3 w-3" /> Master
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell><RoleBadge role={user.role} /></TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-500"}`}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-3">
                          {(!isMaster || isSelf) && (
                            <button
                              onClick={() => openEdit(user)}
                              className="text-xs text-emerald-500 hover:text-emerald-400 font-medium flex items-center gap-1 transition-colors"
                            >
                              <Pencil className="h-3 w-3" /> Edit
                            </button>
                          )}
                          {isMaster && !isSelf && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <Lock className="h-3.5 w-3.5" /> Protected
                            </span>
                          )}
                          {!isMaster && !isSelf && (
                            <>
                              <button
                                onClick={() => toggleUserStatus(user)}
                                className={cn(
                                  "text-xs font-medium transition-colors",
                                  user.isActive ? "text-red-500 hover:text-red-400" : "text-emerald-500 hover:text-emerald-400"
                                )}
                              >
                                {user.isActive ? "Disable" : "Enable"}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ show: true, user })}
                                className="text-xs text-red-500 hover:text-red-400 font-medium flex items-center gap-1 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Panel>

      {/* System Preferences */}
      <Panel title="System Preferences" action={<Settings2 className="h-4 w-4 text-muted-foreground" />}>
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <div className="text-sm font-medium text-foreground">Auto-generate Receipts</div>
              <div className="text-xs text-muted-foreground mt-1">Automatically create a receipt when payment is marked as PAID</div>
            </div>
            <button
              onClick={() => togglePreference("autoGenerateReceipts")}
              disabled={isSavingPreferences}
              className={cn(
                "h-5 w-9 rounded-full relative cursor-pointer transition-all",
                preferences.autoGenerateReceipts ? "bg-emerald-500" : "bg-zinc-700",
                isSavingPreferences && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "absolute top-1 h-3 w-3 rounded-full bg-white shadow-sm transition-all",
                preferences.autoGenerateReceipts ? "right-1" : "left-1"
              )} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">Allow Partial Payments</div>
              <div className="text-xs text-muted-foreground mt-1">Enable cashiers to record partial payments for jobs</div>
            </div>
            <button
              onClick={() => togglePreference("allowPartialPayments")}
              disabled={isSavingPreferences}
              className={cn(
                "h-5 w-9 rounded-full relative cursor-pointer transition-all",
                preferences.allowPartialPayments ? "bg-emerald-500" : "bg-zinc-700",
                isSavingPreferences && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "absolute top-1 h-3 w-3 rounded-full bg-white shadow-sm transition-all",
                preferences.allowPartialPayments ? "right-1" : "left-1"
              )} />
            </button>
          </div>
        </div>
      </Panel>

      {/* 🔒 DANGER ZONE — master owner only */}
      {currentUserId === masterOwnerId && (
        <Panel title="Danger Zone" action={<AlertTriangle className="h-4 w-4 text-red-500" />}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Full System Data Reset</p>
              <p className="text-xs text-muted-foreground mt-1">
                Permanently erase all business data so the system starts clean again. Master account only.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => { setResetConfirmText(""); setShowResetModal(true) }}
              className="border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <AlertTriangle className="h-4 w-4 mr-2" /> Reset System Data
            </Button>
          </div>
        </Panel>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowAddUser(false)}>
          <div className="w-full max-w-md bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden animate-dropdown-enter" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-500" /> Add New Staff Member
              </h3>
              <button onClick={() => setShowAddUser(false)} className="text-muted-foreground hover:text-foreground p-1 transition-all hover:scale-110 active:scale-95">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name *</label>
                <Input required value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} placeholder="e.g., Dawit Solomon" className="bg-background/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address *</label>
                <Input required type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} placeholder="dawit@nati.com" className="bg-background/50 border-border/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password *</label>
                  <div className="relative">
                    <Input required type={showPassword ? "text" : "password"} minLength={6} value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} placeholder="Min 6 chars" className="bg-background/50 border-border/50 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role *</label>
                  <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value as any})} className="flex h-9 w-full rounded-md border border-border/50 bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="TECHNICIAN">Technician</option>
                    <option value="CASHIER">Cashier</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone Number (Optional)</label>
                <Input type="tel" value={newUser.phone} onChange={(e) => setNewUser({...newUser, phone: e.target.value})} placeholder="+251 911 234 567" className="bg-background/50 border-border/50" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddUser(false)} className="flex-1 transition-all hover:scale-[1.02] active:scale-[0.98] border-border/50">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>) : (<><Plus className="h-4 w-4" /> Create User</>)}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setEditTarget(null)}>
          <div className="w-full max-w-md bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden animate-dropdown-enter" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Pencil className="h-4 w-4 text-emerald-500" /> Edit {editTarget.id === masterOwnerId ? "Master Account" : "Staff Member"}
              </h3>
              <button onClick={() => setEditTarget(null)} className="text-muted-foreground hover:text-foreground p-1 transition-all hover:scale-110 active:scale-95">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              {editTarget.id === masterOwnerId && (
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
                  <p className="text-xs text-primary flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Master account — only name, email and password can be changed. Role and status are locked.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name *</label>
                <Input required value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="bg-background/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address *</label>
                <Input required type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="bg-background/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value as any})}
                  disabled={editTarget.id === masterOwnerId}
                  className="flex h-9 w-full rounded-md border border-border/50 bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="TECHNICIAN">Technician</option>
                  <option value="CASHIER">Cashier</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Password (optional)</label>
                <div className="relative">
                  <Input
                    type={showEditPassword ? "text" : "password"}
                    minLength={6}
                    value={editForm.password}
                    onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                    placeholder="Leave blank to keep current password"
                    className="bg-background/50 border-border/50 pr-10"
                  />
                  <button type="button" onClick={() => setShowEditPassword(!showEditPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditTarget(null)} className="flex-1 transition-all hover:scale-[1.02] active:scale-[0.98] border-border/50">Cancel</Button>
                <Button type="submit" disabled={isSavingEdit} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  {isSavingEdit ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>) : (<><Save className="h-4 w-4" /> Save Changes</>)}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && deleteConfirm.user && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setDeleteConfirm({ show: false, user: null })}>
          <div className="w-full max-w-md bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden animate-dropdown-enter" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-500" /> Delete User
              </h3>
              <button onClick={() => setDeleteConfirm({ show: false, user: null })} className="text-muted-foreground hover:text-foreground p-1 transition-all hover:scale-110 active:scale-95">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-foreground">Are you sure you want to delete <span className="font-semibold">{deleteConfirm.user.name}</span>? This action cannot be undone.</p>
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-xs text-red-500">⚠️ This will permanently remove the user from the system. They will no longer be able to log in.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setDeleteConfirm({ show: false, user: null })} className="flex-1 transition-all hover:scale-[1.02] active:scale-[0.98] border-border/50">Cancel</Button>
                <Button onClick={handleDeleteUser} disabled={isDeleting} className="flex-1 bg-red-600 hover:bg-red-500 text-white gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  {isDeleting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>) : (<><Trash2 className="h-4 w-4" /> Delete User</>)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ SYSTEM RESET MODAL — master only, type RESET to confirm */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => !isResetting && setShowResetModal(false)}>
          <div className="w-full max-w-lg bg-card border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden animate-dropdown-enter" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between bg-red-500/10">
              <h3 className="text-base font-bold text-red-500 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Full System Data Reset
              </h3>
              <button onClick={() => !isResetting && setShowResetModal(false)} className="text-muted-foreground hover:text-foreground p-1 transition-all hover:scale-110 active:scale-95">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-foreground">
                This action is <span className="font-bold text-red-500">permanent and cannot be undone</span>. REMINDER: By doing this your are erasing all business data. Including:
              </p>

              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-red-500">Will be permanently deleted</p>
                <ul className="text-xs text-foreground space-y-1 list-disc list-inside">
                  <li>All repair jobs and their materials</li>
                  <li>All sales and invoices</li>
                  <li>All payment records</li>
                  <li>All customers</li>
                  <li>All products, categories and suppliers</li>
                  <li>All expenses</li>
                  <li>All notifications and activity logs</li>
                  <li>All staff accounts except the master owner</li>
                </ul>
              </div>

              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">Will be kept</p>
                <ul className="text-xs text-foreground space-y-1 list-disc list-inside">
                  <li>The master owner account (your login)</li>
                  <li>Business profile and system preferences</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type <span className="font-bold text-red-500">RESET</span> to confirm
                </label>
                <Input
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="RESET"
                  className="bg-background/50 border-red-500/30 text-foreground"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowResetModal(false)} disabled={isResetting} className="flex-1 transition-all hover:scale-[1.02] active:scale-[0.98] border-border/50">
                  Cancel
                </Button>
                <Button
                  onClick={handleSystemReset}
                  disabled={isResetting || resetConfirmText !== "RESET"}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Resetting...</>) : (<><AlertTriangle className="h-4 w-4" /> Erase Everything</>)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}