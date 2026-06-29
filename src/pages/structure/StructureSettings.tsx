import { useState } from 'react'
import { getStructureApi, getStructureSecret, saveStructureConfig } from '../../lib/config'
import { Save, CheckCircle2 } from 'lucide-react'

export function StructureSettings() {
  const [url, setUrl] = useState(getStructureApi)
  const [secret, setSecret] = useState(getStructureSecret)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    saveStructureConfig(url, secret)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-lg font-bold text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground/50 mt-0.5">ERA Structure API configuration</p>
      </div>

      <div className="rounded-xl border border-white/08 bg-white/[0.03] p-5 space-y-4">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 block mb-2">
            ERA Structure API URL
          </label>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://your-era-structure.up.railway.app"
            className="w-full px-3 py-2 rounded-lg text-sm bg-white/[0.05] border border-white/10 text-foreground placeholder-muted-foreground/30 focus:outline-none focus:border-[#C9952B]/50"
          />
          <p className="text-[11px] text-muted-foreground/35 mt-1.5">
            Railway deployment URL for ERA Structure. No trailing slash.
          </p>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 block mb-2">
            Operator Secret
          </label>
          <input
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="Paste your STRUCTURE_OPERATOR_SECRET here"
            className="w-full px-3 py-2 rounded-lg text-sm bg-white/[0.05] border border-white/10 text-foreground placeholder-muted-foreground/30 focus:outline-none focus:border-[#C9952B]/50 font-mono"
          />
          <p className="text-[11px] text-muted-foreground/35 mt-1.5">
            Must match <code className="text-[#C9952B]">STRUCTURE_OPERATOR_SECRET</code> in ERA Structure Railway vars.
          </p>
        </div>

        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
            saved ? 'text-[#4DBFB3] border border-[#4DBFB3]/30 bg-[#4DBFB3]/5' : 'text-background bg-[#C9952B] hover:bg-[#C9952B]/90'
          }`}
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved' : 'Save URL'}
        </button>
      </div>

      <div className="rounded-xl border border-white/08 bg-white/[0.03] p-5 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40">Architecture</p>
        <div className="space-y-2 text-[12px] text-muted-foreground/60 leading-relaxed">
          <p>· ERA Hub (this app) → ERA Structure API at the URL above, using the operator secret</p>
          <p>· ERA Structure client app → deployed separately, used by business owners</p>
          <p>· Data stays in ERA Structure's own Supabase database</p>
          <p>· 50+ clients are fully isolated — each only sees their own data via Supabase RLS</p>
        </div>
      </div>
    </div>
  )
}
