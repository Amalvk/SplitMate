import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LogOut, Moon, Sun, SunMoon } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ROUTES } from '@/constants/routes'
import { isFirebaseConfigured } from '@/services/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { useUiStore, type Theme } from '@/store/uiStore'
import { getAvatarColor } from '@/utils/avatar'
import { cn } from '@/utils/cn'

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: SunMoon },
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.currentUser)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const logout = useAuthStore((s) => s.logout)
  const updateMember = useDataStore((s) => s.updateMember)
  const members = useDataStore((s) => s.members)
  const theme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)

  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [logoutOpen, setLogoutOpen] = useState(false)

  async function handleSave() {
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() || undefined })
      if (!isFirebaseConfigured()) {
        const self = members.find((m) => m.isSelf)
        if (self) updateMember({ ...self, name: name.trim(), avatarColor: getAvatarColor(name.trim()) })
      }
      toast.success('Profile updated')
    } catch (err) {
      toast.error('Couldn’t update profile', { description: err instanceof Error ? err.message : 'Please try again.' })
    }
  }

  async function handleLogout() {
    await logout()
    navigate(ROUTES.landing)
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences.</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-4">
            <Avatar name={name || '?'} size="xl" />
            <div>
              <p className="font-semibold text-lg">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant={isFirebaseConfigured() ? 'info' : 'secondary'} className="mt-1">
                {isFirebaseConfigured() ? 'Connected to Firebase' : 'Demo mode'}
              </Badge>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Name</Label>
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={user?.email ?? ''} disabled />
            <p className="text-[11px] text-muted-foreground">This is how you sign in — enter it on any device to see your groups.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-phone">Mobile number</Label>
            <Input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Input value="INR (₹)" disabled />
          </div>
          <Button onClick={handleSave}>Save changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <Label>Appearance</Label>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-colors',
                  theme === opt.value ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:bg-secondary',
                )}
              >
                <opt.icon className="size-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={() => setLogoutOpen(true)}>
        <LogOut className="size-4" /> Log out
      </Button>

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Log out?"
        description="You can sign back in anytime — your demo data stays on this device."
        confirmLabel="Log out"
        destructive
        onConfirm={handleLogout}
      />
    </div>
  )
}
