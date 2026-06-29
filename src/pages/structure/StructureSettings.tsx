import { getStructureApi } from '../../lib/config'
import { Server } from 'lucide-react'

export function StructureSettings() {
  const url = getStructureApi()

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-lg font-bold text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground/50 mt-0.5">ERA Structure connection</p>
      </div>

      <div className="rounded-xl border border-white/08 bg-white/[0.03] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-[#C9952B]" />
          <p className="text-sm font-semibold text-foreground">Connected API</p>
          {url
            ? <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#4DBFB3]/10 text-[#4DBFB3] font-semibold">Active</span>
            : <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-semibold">Not configured</span>
          }
        </div>
        <p className="text-[12px] text-muted-foreground/60 font-mono break-all">{url || '—'}</p>
        <p className="text-[11px] text-muted-foreground/40">
          Set <code className="text-[#C9952B]">STRUCTURE_API_URL</code> and <code className="text-[#C9952B]">STRUCTURE_OPERATOR_SECRET</code> in ERA Hub's Railway environment variables.
        </p>
      </div>

      <div className="rounded-xl border border-white/08 bg-white/[0.03] p-5 space-y-2 text-[12px] text-muted-foreground/60 leading-relaxed">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40 mb-3">Architecture</p>
        <p>· ERA Hub → ERA Structure API using server-side env vars (no secrets in the browser)</p>
        <p>· ERA Structure client app → used by business owners, deployed separately</p>
        <p>· Data isolated per client via Supabase Row Level Security</p>
      </div>
    </div>
  )
}
