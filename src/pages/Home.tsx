import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, MessageSquare, Zap, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react'
import { patientApi, HealthCheck } from '../lib/patient-api'
import { commsApi, MonitoringSnapshot } from '../lib/comms-api'

export function Home() {
  const nav = useNavigate()
  const [health, setHealth] = useState<HealthCheck | null>(null)
  const [comms,  setComms]  = useState<MonitoringSnapshot | null>(null)

  useEffect(() => {
    void patientApi.getHealth().then(setHealth).catch(() => null)
    void commsApi.monitoring().then(setComms).catch(() => null)
  }, [])

  const commsActive  = comms?.sessions.connected ?? 0
  const commsTotal   = comms?.sessions.total ?? 0
  const commsHealthy = comms ? commsActive === commsTotal && commsTotal > 0 : null

  return (
    <div className="min-h-[calc(100vh-3rem)] flex flex-col justify-center px-6 md:px-12 py-12 max-w-4xl mx-auto w-full">

      {/* Header */}
      <div className="mb-12">
        <p className="text-[10px] font-bold text-muted-foreground/35 uppercase tracking-[0.32em] mb-3">
          Era Systems · Operator Hub
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
          Good day
        </h1>
        <p className="text-muted-foreground mt-3 text-base">
          Select a product to enter its environment
        </p>
      </div>

      {/* Portal cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">

        {/* ERA Patient */}
        <button
          onClick={() => nav('/patient/analytics')}
          className="group relative text-left rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(74,168,157,0.16)]"
          style={{ background: 'hsl(var(--card))', borderColor: 'rgba(74,168,157,0.20)' }}
        >
          {/* Ambient top glow */}
          <div className="absolute inset-x-0 top-0 h-40 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 110% 100% at 50% -10%, rgba(74,168,157,0.16) 0%, transparent 75%)' }} />

          <div className="relative p-6 flex flex-col h-full min-h-[220px]">
            <div className="flex items-start justify-between mb-6">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(74,168,157,0.14)', border: '1px solid rgba(74,168,157,0.28)' }}>
                <Building2 className="w-5 h-5 text-teal" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/25 group-hover:text-teal group-hover:translate-x-1 transition-all duration-200 mt-1" />
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground tracking-tight mb-1.5">ERA Patient</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Hospital management, patient pipelines, and clinical automation
              </p>
            </div>

            <div className="mt-5 pt-4 border-t flex items-center gap-2.5"
              style={{ borderColor: 'rgba(74,168,157,0.14)' }}>
              {health?.ok === true
                ? <CheckCircle className="w-3.5 h-3.5 text-teal shrink-0" />
                : health?.ok === false
                ? <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                : <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/20 shrink-0" />}
              <span className="text-xs text-muted-foreground">
                {health === null
                  ? 'Checking status…'
                  : health.ok
                  ? 'All systems healthy'
                  : 'Issues detected'}
              </span>
            </div>
          </div>

          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(74,168,157,0.45), transparent)' }} />
        </button>

        {/* ERA Comms */}
        <button
          onClick={() => nav('/comms/sessions')}
          className="group relative text-left rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(191,124,147,0.16)]"
          style={{ background: 'hsl(var(--card))', borderColor: 'rgba(191,124,147,0.20)' }}
        >
          {/* Ambient top glow */}
          <div className="absolute inset-x-0 top-0 h-40 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 110% 100% at 50% -10%, rgba(191,124,147,0.14) 0%, transparent 75%)' }} />

          <div className="relative p-6 flex flex-col h-full min-h-[220px]">
            <div className="flex items-start justify-between mb-6">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(191,124,147,0.14)', border: '1px solid rgba(191,124,147,0.28)' }}>
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/25 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 mt-1" />
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground tracking-tight mb-1.5">ERA Comms</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                WhatsApp messaging infrastructure, session management, and delivery
              </p>
            </div>

            <div className="mt-5 pt-4 border-t flex items-center gap-2.5"
              style={{ borderColor: 'rgba(191,124,147,0.14)' }}>
              {commsHealthy === true
                ? <CheckCircle className="w-3.5 h-3.5 text-teal shrink-0" />
                : commsHealthy === false
                ? <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                : <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/20 shrink-0" />}
              <span className="text-xs text-muted-foreground">
                {comms === null
                  ? 'Checking status…'
                  : `${commsActive} of ${commsTotal} sessions connected`}
              </span>
            </div>
          </div>

          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(191,124,147,0.45), transparent)' }} />
        </button>
      </div>

      {/* ERA Connect — coming soon */}
      <div
        className="rounded-2xl border overflow-hidden opacity-40"
        style={{ background: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="p-5 flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(155,138,233,0.12)', border: '1px solid rgba(155,138,233,0.22)' }}>
            <Zap className="w-4 h-4" style={{ color: '#9b8ae9' }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">ERA Connect</p>
            <p className="text-xs text-muted-foreground mt-0.5">Patient-facing booking portal and telehealth integrations</p>
          </div>
          <span className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(237,233,245,0.30)' }}>
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  )
}
