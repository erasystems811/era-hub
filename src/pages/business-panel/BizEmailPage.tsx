import { useEffect, useState, useRef } from 'react'
import {
  Mail, Plus, Trash2, Send, Users, FileText, BarChart2,
  ChevronRight, Loader2, AlertCircle, CheckCircle2, X, Upload
} from 'lucide-react'
import {
  bizApi,
  type EmailTemplate, type ContactList, type Contact, type Campaign, type EmailDomain
} from './business-api'

type Tab = 'templates' | 'contacts' | 'campaigns'

const FIELD = "w-full px-3 py-2.5 rounded-xl bg-[hsl(262_20%_8%)] border border-white/[0.09] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#BF7C93]/50 focus:ring-2 focus:ring-[#BF7C93]/15 transition-all"
const LABEL = "text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70 block mb-1.5"
const BTN   = "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all"

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
        active ? 'bg-[#BF7C93]/15 text-[#BF7C93]' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
      }`}>
      {children}
    </button>
  )
}

// ── Templates tab ──────────────────────────────────────────────

function TemplatesTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [editing, setEditing]     = useState<EmailTemplate | null>(null)
  const [form, setForm]           = useState({ name: '', subject: '', htmlBody: '' })
  const [error, setError]         = useState('')

  useEffect(() => { bizApi.listTemplates().then(setTemplates).finally(() => setLoading(false)) }, [])

  function openCreate() { setForm({ name: '', subject: '', htmlBody: '' }); setEditing(null); setCreating(true); setError('') }
  function openEdit(t: EmailTemplate) { setForm({ name: t.name, subject: t.subject, htmlBody: t.htmlBody }); setEditing(t); setCreating(true); setError('') }

  async function save() {
    if (!form.name.trim() || !form.subject.trim() || !form.htmlBody.trim()) {
      setError('All fields are required.'); return
    }
    setSaving(true); setError('')
    try {
      if (editing) {
        await bizApi.updateTemplate(editing.id, form)
        setTemplates(ts => ts.map(t => t.id === editing.id ? { ...t, ...form } : t))
      } else {
        const t = await bizApi.createTemplate(form)
        setTemplates(ts => [t, ...ts])
      }
      setCreating(false)
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') }
    finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete this template?')) return
    await bizApi.deleteTemplate(id)
    setTemplates(ts => ts.filter(t => t.id !== id))
  }

  if (loading) return <Loader />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
        <button onClick={openCreate} className={`${BTN} bg-[#BF7C93] text-white hover:bg-[#a86a7e]`}>
          <Plus className="w-3.5 h-3.5" /> New Template
        </button>
      </div>

      {creating && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'hsl(262 20% 10%)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{editing ? 'Edit template' : 'New template'}</p>
            <button onClick={() => setCreating(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div>
            <label className={LABEL}>Template name</label>
            <input className={FIELD} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Monthly Newsletter" />
          </div>
          <div>
            <label className={LABEL}>Email subject line</label>
            <input className={FIELD} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Special offers just for you 🎉" />
          </div>
          <div>
            <label className={LABEL}>HTML body</label>
            <textarea
              className={FIELD} rows={10} value={form.htmlBody}
              onChange={e => setForm(f => ({ ...f, htmlBody: e.target.value }))}
              placeholder="Paste your HTML email here. You can build it with GrapeJS and paste the output."
              style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
            />
            <p className="text-[11px] text-muted-foreground/50 mt-1">
              Use <code style={{ color: '#BF7C93' }}>{`{{firstName}}`}</code> and <code style={{ color: '#BF7C93' }}>{`{{email}}`}</code> as personalization variables.
            </p>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setCreating(false)} className={`${BTN} bg-white/6 text-muted-foreground hover:bg-white/10`}>Cancel</button>
            <button onClick={save} disabled={saving} className={`${BTN} bg-[#BF7C93] text-white hover:bg-[#a86a7e] disabled:opacity-50`}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save
            </button>
          </div>
        </div>
      )}

      {templates.length === 0 && !creating ? (
        <Empty icon={FileText} text="No templates yet. Create one to start sending campaigns." />
      ) : (
        <div className="space-y-2">
          {templates.map(t => (
            <div key={t.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'hsl(262 20% 10%)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{t.subject}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <button onClick={() => openEdit(t)} className="text-xs text-muted-foreground hover:text-[#BF7C93] transition-colors px-2 py-1">Edit</button>
                <button onClick={() => del(t.id)} className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/8 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Contacts tab ───────────────────────────────────────────────

function ContactsTab() {
  const [lists, setLists]         = useState<ContactList[]>([])
  const [loading, setLoading]     = useState(true)
  const [openList, setOpenList]   = useState<ContactList | null>(null)
  const [contacts, setContacts]   = useState<Contact[]>([])
  const [loadingC, setLoadingC]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [creating, setCreating]   = useState(false)
  const [importing, setImporting] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [saving, setSaving]       = useState(false)

  useEffect(() => { bizApi.listContactLists().then(setLists).finally(() => setLoading(false)) }, [])

  async function createList() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const l = await bizApi.createContactList(newName.trim())
      setLists(ls => [l, ...ls])
      setNewName(''); setCreating(false)
    } finally { setSaving(false) }
  }

  async function openContacts(list: ContactList) {
    setOpenList(list); setLoadingC(true); setImporting(false); setImportText(''); setImportError('')
    const cs = await bizApi.getContacts(list.id)
    setContacts(cs); setLoadingC(false)
  }

  async function doImport() {
    if (!openList) return
    setImportError('')
    let parsed: { email: string; firstName?: string; lastName?: string }[] = []
    try {
      const lines = importText.trim().split('\n').filter(Boolean)
      parsed = lines.map(line => {
        const parts = line.split(',').map(s => s.trim())
        return { email: parts[0] ?? '', firstName: parts[1] || undefined, lastName: parts[2] || undefined }
      }).filter(c => c.email.includes('@'))
    } catch {
      setImportError('Could not parse contacts. Use: email, firstName, lastName (one per line).')
      return
    }
    if (parsed.length === 0) { setImportError('No valid emails found.'); return }
    setSaving(true)
    try {
      const { imported } = await bizApi.importContacts(openList.id, parsed)
      const cs = await bizApi.getContacts(openList.id)
      setContacts(cs)
      setLists(ls => ls.map(l => l.id === openList.id ? { ...l, contactCount: cs.length } : l))
      setImportText(''); setImporting(false)
      alert(`${imported} contact${imported !== 1 ? 's' : ''} imported.`)
    } catch (e) { setImportError(e instanceof Error ? e.message : 'Import failed') }
    finally { setSaving(false) }
  }

  async function delContact(id: string) {
    await bizApi.deleteContact(id)
    setContacts(cs => cs.filter(c => c.id !== id))
    if (openList) setLists(ls => ls.map(l => l.id === openList.id ? { ...l, contactCount: l.contactCount - 1 } : l))
  }

  async function delList(id: string) {
    if (!confirm('Delete this list and all its contacts?')) return
    await bizApi.deleteContactList(id)
    setLists(ls => ls.filter(l => l.id !== id))
    if (openList?.id === id) setOpenList(null)
  }

  if (loading) return <Loader />

  if (openList) return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setOpenList(null)} className="text-muted-foreground hover:text-foreground text-xs transition-colors">← All lists</button>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
        <p className="text-sm font-semibold">{openList.name}</p>
        <span className="text-xs text-muted-foreground">({contacts.length} contacts)</span>
      </div>

      {importing ? (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: 'hsl(262 20% 10%)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm font-semibold">Import contacts</p>
          <p className="text-xs text-muted-foreground">One per line: <code style={{ color: '#BF7C93' }}>email, firstName, lastName</code> (firstName and lastName optional)</p>
          <textarea className={FIELD} rows={8} value={importText} onChange={e => setImportText(e.target.value)}
            placeholder={"john@example.com, John, Doe\njane@example.com, Jane"}
            style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
          {importError && <p className="text-xs text-red-400">{importError}</p>}
          <div className="flex gap-2">
            <button onClick={() => setImporting(false)} className={`${BTN} bg-white/6 text-muted-foreground hover:bg-white/10`}>Cancel</button>
            <button onClick={doImport} disabled={saving || !importText.trim()} className={`${BTN} bg-[#BF7C93] text-white disabled:opacity-50`}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Import
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setImporting(true)} className={`${BTN} bg-white/6 text-muted-foreground hover:bg-white/10 border border-white/8`}>
          <Upload className="w-3.5 h-3.5" /> Import contacts
        </button>
      )}

      {loadingC ? <Loader /> : contacts.length === 0 ? (
        <Empty icon={Users} text="No contacts yet. Import some above." />
      ) : (
        <div className="space-y-1.5">
          {contacts.map(c => (
            <div key={c.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ background: 'hsl(262 20% 10%)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-sm text-foreground">{c.email}</p>
                {(c.firstName || c.lastName) && (
                  <p className="text-xs text-muted-foreground">{[c.firstName, c.lastName].filter(Boolean).join(' ')}</p>
                )}
              </div>
              <button onClick={() => delContact(c.id)} className="p-1.5 text-muted-foreground/40 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{lists.length} list{lists.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setCreating(c => !c)} className={`${BTN} bg-[#BF7C93] text-white hover:bg-[#a86a7e]`}>
          <Plus className="w-3.5 h-3.5" /> New List
        </button>
      </div>

      {creating && (
        <div className="flex gap-2 p-4 rounded-2xl" style={{ background: 'hsl(262 20% 10%)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <input className={`${FIELD} flex-1`} value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="List name e.g. Customers June 2025" onKeyDown={e => e.key === 'Enter' && createList()} />
          <button onClick={createList} disabled={saving || !newName.trim()} className={`${BTN} bg-[#BF7C93] text-white disabled:opacity-50`}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create'}
          </button>
        </div>
      )}

      {lists.length === 0 && !creating ? (
        <Empty icon={Users} text="No contact lists yet. Create one to start building your audience." />
      ) : (
        <div className="space-y-2">
          {lists.map(l => (
            <div key={l.id} className="flex items-center justify-between p-4 rounded-xl cursor-pointer hover:border-[#BF7C93]/20 transition-all"
              style={{ background: 'hsl(262 20% 10%)', border: '1px solid rgba(255,255,255,0.07)' }}
              onClick={() => openContacts(l)}>
              <div>
                <p className="text-sm font-medium text-foreground">{l.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{l.contactCount.toLocaleString()} contact{l.contactCount !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); delList(l.id) }}
                  className="p-1.5 text-muted-foreground/40 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Campaigns tab ──────────────────────────────────────────────

function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [lists, setLists]         = useState<ContactList[]>([])
  const [domains, setDomains]     = useState<EmailDomain[]>([])

  const [form, setForm] = useState({
    name: '', templateId: '', listId: '', domainId: '',
    fromName: '', fromEmail: '', scheduledAt: '',
  })

  useEffect(() => {
    Promise.all([
      bizApi.listCampaigns(),
      bizApi.listTemplates(),
      bizApi.listContactLists(),
      bizApi.getEmailDomains(),
    ]).then(([camps, tmpl, lsts, doms]) => {
      setCampaigns(camps); setTemplates(tmpl); setLists(lsts); setDomains(doms)
    }).finally(() => setLoading(false))
  }, [])

  function openCreate() {
    setForm({ name: '', templateId: '', listId: '', domainId: '', fromName: '', fromEmail: '', scheduledAt: '' })
    setError(''); setCreating(true)
  }

  async function create() {
    const { name, templateId, listId, domainId, fromName, fromEmail, scheduledAt } = form
    if (!name.trim() || !templateId || !listId || !domainId || !fromName.trim() || !fromEmail.trim()) {
      setError('All fields except schedule are required.'); return
    }
    setSaving(true); setError('')
    try {
      const c = await bizApi.createCampaign({ name: name.trim(), templateId, listId, domainId, fromName: fromName.trim(), fromEmail: fromEmail.trim(), scheduledAt: scheduledAt || undefined })
      setCampaigns(cs => [c, ...cs]); setCreating(false)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to create campaign') }
    finally { setSaving(false) }
  }

  async function send(id: string) {
    if (!confirm('Send this campaign now? This cannot be undone.')) return
    try {
      await bizApi.sendCampaign(id)
      setCampaigns(cs => cs.map(c => c.id === id ? { ...c, status: 'sending' } : c))
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed to send') }
  }

  async function cancel(id: string) {
    await bizApi.cancelCampaign(id)
    setCampaigns(cs => cs.map(c => c.id === id ? { ...c, status: 'cancelled' } : c))
  }

  async function del(id: string) {
    if (!confirm('Delete this campaign?')) return
    await bizApi.deleteCampaign(id)
    setCampaigns(cs => cs.filter(c => c.id !== id))
  }

  const verifiedDomains = domains.filter(d => d.verified)

  if (loading) return <Loader />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
        <button onClick={openCreate} className={`${BTN} bg-[#BF7C93] text-white hover:bg-[#a86a7e]`}>
          <Plus className="w-3.5 h-3.5" /> New Campaign
        </button>
      </div>

      {creating && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'hsl(262 20% 10%)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">New campaign</p>
            <button onClick={() => setCreating(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>

          {verifiedDomains.length === 0 && (
            <div className="rounded-xl px-4 py-3 text-xs" style={{ background: 'rgba(239,200,100,0.07)', border: '1px solid rgba(239,200,100,0.15)', color: '#d4a430' }}>
              No verified sending domain found. Contact ERA Systems to set up your domain before sending campaigns.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={LABEL}>Campaign name</label>
              <input className={FIELD} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. June Promo Blast" />
            </div>
            <div>
              <label className={LABEL}>Email template</label>
              <select className={FIELD} value={form.templateId} onChange={e => setForm(f => ({ ...f, templateId: e.target.value }))} style={{ background: 'hsl(262 20% 8%)' }}>
                <option value="">Select template…</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Contact list</label>
              <select className={FIELD} value={form.listId} onChange={e => setForm(f => ({ ...f, listId: e.target.value }))} style={{ background: 'hsl(262 20% 8%)' }}>
                <option value="">Select list…</option>
                {lists.map(l => <option key={l.id} value={l.id}>{l.name} ({l.contactCount})</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>From name</label>
              <input className={FIELD} value={form.fromName} onChange={e => setForm(f => ({ ...f, fromName: e.target.value }))} placeholder="e.g. Lagos Fashion Store" />
            </div>
            <div>
              <label className={LABEL}>From email</label>
              <input className={FIELD} type="email" value={form.fromEmail} onChange={e => setForm(f => ({ ...f, fromEmail: e.target.value }))} placeholder="hello@yourdomain.com" />
            </div>
            <div>
              <label className={LABEL}>Sending domain</label>
              <select className={FIELD} value={form.domainId} onChange={e => setForm(f => ({ ...f, domainId: e.target.value }))} style={{ background: 'hsl(262 20% 8%)' }}>
                <option value="">Select domain…</option>
                {verifiedDomains.map(d => <option key={d.id} value={d.id}>{d.domain}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Schedule (optional)</label>
              <input className={FIELD} type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
              <p className="text-[11px] text-muted-foreground/50 mt-1">Leave blank to save as draft and send manually.</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setCreating(false)} className={`${BTN} bg-white/6 text-muted-foreground hover:bg-white/10`}>Cancel</button>
            <button onClick={create} disabled={saving} className={`${BTN} bg-[#BF7C93] text-white hover:bg-[#a86a7e] disabled:opacity-50`}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save campaign
            </button>
          </div>
        </div>
      )}

      {campaigns.length === 0 && !creating ? (
        <Empty icon={Send} text="No campaigns yet. Create one, pick a template and contact list, and hit send." />
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c.id} className="p-4 rounded-xl space-y-3" style={{ background: 'hsl(262 20% 10%)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.templateName} → {c.listName} ({c.totalRecipients} recipients)
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {(c.status === 'draft' || c.status === 'scheduled') && (
                    <button onClick={() => send(c.id)}
                      className={`${BTN} bg-[#4AA89D]/15 text-[#4AA89D] hover:bg-[#4AA89D]/25 border border-[#4AA89D]/20`}>
                      <Send className="w-3.5 h-3.5" /> Send now
                    </button>
                  )}
                  {(c.status === 'draft' || c.status === 'scheduled') && (
                    <button onClick={() => cancel(c.id)} className="p-1.5 text-muted-foreground/40 hover:text-amber-400 transition-colors" title="Cancel">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {(c.status === 'draft' || c.status === 'cancelled') && (
                    <button onClick={() => del(c.id)} className="p-1.5 text-muted-foreground/40 hover:text-red-400 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {(c.status === 'sending' || c.status === 'sent') && (
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Sent', value: c.totalSent },
                    { label: 'Delivered', value: c.totalDelivered },
                    { label: 'Clicked', value: c.totalClicked },
                    { label: 'Bounced', value: c.totalBounced },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg p-2.5 text-center" style={{ background: 'hsl(262 20% 8%)' }}>
                      <p className="text-base font-bold text-foreground">{s.value.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Shared helpers ─────────────────────────────────────────────

function Loader() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-5 h-5 rounded-full border-2 border-[#BF7C93]/30 border-t-[#BF7C93] animate-spin" />
    </div>
  )
}

function Empty({ icon: Icon, text }: { icon: typeof Mail; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl"
      style={{ background: 'hsl(262 20% 10%)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <Icon className="w-8 h-8 text-muted-foreground/25 mb-3" />
      <p className="text-sm text-muted-foreground max-w-xs">{text}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    draft:     { label: 'Draft',     color: 'rgba(237,233,245,0.5)',  bg: 'rgba(255,255,255,0.06)' },
    scheduled: { label: 'Scheduled', color: '#d4a430',               bg: 'rgba(239,200,100,0.10)' },
    sending:   { label: 'Sending',   color: '#4AA89D',               bg: 'rgba(74,168,157,0.12)'  },
    sent:      { label: 'Sent',      color: '#4AA89D',               bg: 'rgba(74,168,157,0.12)'  },
    cancelled: { label: 'Cancelled', color: '#f87171',               bg: 'rgba(239,68,68,0.08)'   },
  }
  const s = map[status] ?? map.draft!
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  )
}

// ── Page ───────────────────────────────────────────────────────

export function BizEmailPage() {
  const [tab, setTab] = useState<Tab>('campaigns')

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-5 h-5 text-[#BF7C93]" />
          <h1 className="text-xl font-bold text-foreground">Email Campaigns</h1>
        </div>
        <p className="text-sm text-muted-foreground">Send bulk emails to your customers using your own branded templates.</p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: 'hsl(262 20% 10%)' }}>
        <TabBtn active={tab === 'campaigns'} onClick={() => setTab('campaigns')}>Campaigns</TabBtn>
        <TabBtn active={tab === 'templates'} onClick={() => setTab('templates')}>Templates</TabBtn>
        <TabBtn active={tab === 'contacts'}  onClick={() => setTab('contacts')}>Contacts</TabBtn>
      </div>

      {tab === 'campaigns' && <CampaignsTab />}
      {tab === 'templates' && <TemplatesTab />}
      {tab === 'contacts'  && <ContactsTab />}
    </div>
  )
}
