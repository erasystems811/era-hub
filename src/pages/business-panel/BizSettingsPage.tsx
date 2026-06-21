import { useState, useEffect } from 'react'
import { Save, Eye, EyeOff, X } from 'lucide-react'
import { bizApi, type BizProfile, type NotificationPrefs } from './business-api'

const INPUT = 'w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all'
const LABEL = 'text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-xl border border-white/[0.07] bg-card space-y-5">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label, sub }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{ minWidth: 40, height: 22 }}
        className={`relative rounded-full shrink-0 mt-0.5 transition-colors ${checked ? 'bg-primary' : 'bg-white/10'}`}
      >
        <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-[20px]' : 'left-[3px]'}`} />
      </button>
    </div>
  )
}

function SaveBtn({ onClick, saving, saved }: { onClick: () => void; saving: boolean; saved: boolean }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
      <Save className="w-3.5 h-3.5" />
      {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
    </button>
  )
}

export function BizSettingsPage() {
  const [profile, setProfile]   = useState<BizProfile | null>(null)
  const [notifs, setNotifs]     = useState<NotificationPrefs>({ whatsappHandoffAlerts: true, emailDailyDigest: false })
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  // Profile form
  const [email, setEmail]   = useState('')
  const [phone, setPhone]   = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savedProfile, setSavedProfile]   = useState(false)

  // Password form
  const [curPw, setCurPw]     = useState('')
  const [newPw, setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [savingPw, setSavingPw]   = useState(false)
  const [savedPw, setSavedPw]     = useState(false)
  const [pwError, setPwError]     = useState('')

  // Notifications form
  const [savingNotifs, setSavingNotifs] = useState(false)
  const [savedNotifs, setSavedNotifs]   = useState(false)

  useEffect(() => {
    Promise.all([
      bizApi.getProfile(),
      bizApi.getNotifications().catch(() => null),
    ]).then(([p, n]) => {
      setProfile(p)
      setEmail(p.contactEmail ?? '')
      setPhone(p.contactPhone ?? '')
      if (n) setNotifs(n)
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const saveProfile = async () => {
    setSavingProfile(true)
    setError('')
    try {
      await bizApi.updateProfile({ contactEmail: email, contactPhone: phone })
      setSavedProfile(true)
      setTimeout(() => setSavedProfile(false), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async () => {
    setPwError('')
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return }
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters'); return }
    setSavingPw(true)
    try {
      await bizApi.changePassword(curPw, newPw)
      setCurPw(''); setNewPw(''); setConfirmPw('')
      setSavedPw(true)
      setTimeout(() => setSavedPw(false), 2000)
    } catch (e: unknown) {
      setPwError(e instanceof Error ? e.message : 'Failed to change password')
    } finally {
      setSavingPw(false)
    }
  }

  const saveNotifs = async () => {
    setSavingNotifs(true)
    try {
      await bizApi.updateNotifications(notifs)
      setSavedNotifs(true)
      setTimeout(() => setSavedNotifs(false), 2000)
    } catch {} finally {
      setSavingNotifs(false)
    }
  }

  if (loading) return <div className="text-center py-16 text-muted-foreground text-sm">Loading...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          {error} <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Profile */}
      <Section title="Profile">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Business name</label>
            <input className={INPUT + ' opacity-50 cursor-not-allowed'} readOnly value={profile?.name ?? ''} />
          </div>
          <div>
            <label className={LABEL}>Slug</label>
            <input className={INPUT + ' opacity-50 cursor-not-allowed'} readOnly value={profile?.slug ?? ''} />
          </div>
          <div>
            <label className={LABEL}>Contact email</label>
            <input className={INPUT} type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Contact phone</label>
            <input className={INPUT} type="tel" placeholder="+234..." value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground/50">Business name and slug can only be changed by ERA Systems support</p>
          <SaveBtn onClick={saveProfile} saving={savingProfile} saved={savedProfile} />
        </div>
      </Section>

      {/* Change password */}
      <Section title="Change password">
        {pwError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{pwError}</div>
        )}
        <div className="space-y-3">
          <div>
            <label className={LABEL}>Current password</label>
            <div className="relative">
              <input className={INPUT + ' pr-10'} type={showPw ? 'text' : 'password'}
                value={curPw} onChange={e => setCurPw(e.target.value)} autoComplete="current-password" />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>New password</label>
              <input className={INPUT} type={showPw ? 'text' : 'password'}
                value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="new-password" />
            </div>
            <div>
              <label className={LABEL}>Confirm new password</label>
              <input className={INPUT} type={showPw ? 'text' : 'password'}
                value={confirmPw} onChange={e => setConfirmPw(e.target.value)} autoComplete="new-password" />
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-1">
          <SaveBtn onClick={savePassword} saving={savingPw} saved={savedPw} />
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <div className="space-y-4">
          <Toggle
            checked={notifs.whatsappHandoffAlerts}
            onChange={v => setNotifs(n => ({ ...n, whatsappHandoffAlerts: v }))}
            label="WhatsApp alerts for new handoffs"
            sub="Receive a WhatsApp message when a customer needs human attention"
          />
          <Toggle
            checked={notifs.emailDailyDigest}
            onChange={v => setNotifs(n => ({ ...n, emailDailyDigest: v }))}
            label="Email digest — daily summary"
            sub="A daily email with your conversation and usage stats"
          />
        </div>
        <div className="flex justify-end pt-1">
          <SaveBtn onClick={saveNotifs} saving={savingNotifs} saved={savedNotifs} />
        </div>
      </Section>

      {/* Danger zone */}
      <Section title="Danger zone">
        <div className="p-4 rounded-xl border border-red-500/10 bg-red-500/[0.03]">
          <p className="text-sm font-semibold text-foreground mb-1">Request account deletion</p>
          <p className="text-xs text-muted-foreground/60">
            To delete your account and all associated data, contact ERA Systems support.
          </p>
        </div>
      </Section>
    </div>
  )
}
