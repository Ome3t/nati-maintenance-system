"use client"

import { useEffect, useState } from "react"
import { getUsers, getBusinessProfile } from "@/actions/settings"
import { Panel } from "@/components/shared/panel"
import { RoleBadge } from "@/components/shared/role-badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Building2, Users, Settings2, Plus, Save, RefreshCw } from "lucide-react"
import type { User, BusinessProfile } from "../../../../domain/types/settings"

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    const [usersData, profileData] = await Promise.all([
      getUsers(),
      getBusinessProfile(),
    ])
    setUsers(usersData)
    setProfile(profileData)
    setIsLoading(false)
  }

  if (isLoading || !profile) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <RefreshCw className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage your business profile, staff, and system preferences.</p>
      </div>

      {/* 1. Business Profile */}
      <Panel title="Business Profile" action={<Building2 className="h-4 w-4 text-zinc-400" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Business Name</label>
            <Input defaultValue={profile.businessName} className="bg-zinc-900/50 border-white/10 text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Phone Number</label>
            <Input defaultValue={profile.phone} className="bg-zinc-900/50 border-white/10 text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email Address</label>
            <Input defaultValue={profile.email} className="bg-zinc-900/50 border-white/10 text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Tax ID (Optional)</label>
            <Input defaultValue={profile.taxId} className="bg-zinc-900/50 border-white/10 text-white" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Physical Address</label>
            <Input defaultValue={profile.address} className="bg-zinc-900/50 border-white/10 text-white" />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
            <Save className="h-4 w-4 mr-2" /> Save Changes
          </Button>
        </div>
      </Panel>

      {/* 2. Staff Management */}
      <Panel title="Staff Management" action={
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white h-8">
          <Plus className="h-3 w-3 mr-2" /> Add User
        </Button>
      }>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-zinc-400">Name</TableHead>
              <TableHead className="text-zinc-400">Phone</TableHead>
              <TableHead className="text-zinc-400">Role</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Joined</TableHead>
              <TableHead className="text-zinc-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                <TableCell className="font-medium text-white">{user.fullName}</TableCell>
                <TableCell className="text-zinc-400">{user.phone}</TableCell>
                <TableCell><RoleBadge role={user.role} /></TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-500"
                  }`}>
                    {user.status === "ACTIVE" ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-zinc-400 text-sm">{user.joinedDate}</TableCell>
                <TableCell className="text-right">
                  <button className="text-xs text-emerald-500 hover:text-emerald-400 font-medium mr-3">Edit</button>
                  <button className="text-xs text-red-500 hover:text-red-400 font-medium">Disable</button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      {/* 3. System Preferences */}
      <Panel title="System Preferences" action={<Settings2 className="h-4 w-4 text-zinc-400" />}>
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <div className="text-sm font-medium text-white">SMS Notifications</div>
              <div className="text-xs text-zinc-500 mt-1">Send SMS to customers when job status changes (V2)</div>
            </div>
            <div className="h-5 w-9 rounded-full bg-zinc-700 relative cursor-not-allowed opacity-50">
              <div className="absolute left-1 top-1 h-3 w-3 rounded-full bg-white" />
            </div>
          </div>
          
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <div className="text-sm font-medium text-white">Auto-generate Receipts</div>
              <div className="text-xs text-zinc-500 mt-1">Automatically create a receipt when payment is marked as PAID</div>
            </div>
            <div className="h-5 w-9 rounded-full bg-emerald-500 relative cursor-pointer">
              <div className="absolute right-1 top-1 h-3 w-3 rounded-full bg-white" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Allow Partial Payments</div>
              <div className="text-xs text-zinc-500 mt-1">Enable cashiers to record partial payments for jobs</div>
            </div>
            <div className="h-5 w-9 rounded-full bg-emerald-500 relative cursor-pointer">
              <div className="absolute right-1 top-1 h-3 w-3 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </Panel>
    </div>
  )
}