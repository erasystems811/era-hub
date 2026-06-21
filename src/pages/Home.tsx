import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, MessageSquare, Zap, ArrowRight, CheckCircle, AlertTriangle, Circle } from 'lucide-react'
import { Glass } from '../components/Glass'
import { patientApi, HealthCheck } from '../lib/patient-api'
import { commsApi, MonitoringSnapshot } from '../lib/comms-api'

function ProductCard({
  title, subtitle, icon, color, path, available = true,
  children,
}: {
  title: string; subtitle: string; icon: JSX.Element
  color: string; path: string; available?: boolean
  children?: React.ReactNode
}) {
  const nav = useNavigate()
  return (
    <Glass
      hover={available}
      className={!available ? 'opacity-50' : ''}
      onClick={() => available && nav(path)}
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white"
          style={{ background: color }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {!available && (
              <span className="text-[10px] bg-primary/15 text-primary rounded-full px-2 py-0.5 font-semibold">Soon</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          {children && <div className="mt-3">{children}</div>}
        </div>
        {available && <ArrowRight className="w-4 h-4 text-muted-foreground/40 mt-1 shrink-0" />}
      </div>
    </Glass>
  )
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1 text-xs font-medium"
        style={{
          color: ok === true
            ? 'hsl(175 40% 55%)'
            : ok === false
            ? 'hsl(340 35% 65%)'
            : 'rgba(237,233,245,0.35)',
        }}>
        {ok === true
          ? <CheckCircle className="w-3 h-3" />
          : ok === false
          ? <AlertTriangle className="w-3 h-3" />
          : <Circle className="w-3 h-3 opacity-40" />}
        {value}
      </span>
    </div>
  )
}

export function Home() {
  const [health, setHealth] = useState<HealthCheck | null>(null)
  const [comms, setComms] = useState<MonitoringSnapshot | null>(null)

  useEffect(() => {
    void patientApi.getHealth().then(setHealth).catch(() => null)
    void commsApi.monitoring().then(setComms).catch(() => null)
  }, [])

  const allHealthy = health?.ok ?? null
  const commsActive = comms?.sessions.connected ?? 0
  const commsTotal = comms?.sessions.total ?? 0

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="page-title">Good day</h1>
        <p className="caption mt-1">Live status of all ERA Systems products</p>
      </div>

      <div className="grid gap-4">
        <ProductCard
          title="ERA Patient"
          subtitle="Hospital management, patient pipelines, and clinical automation"
          icon={<Building2 className="w-5 h-5" />}
          color="linear-gradient(135deg, #5AADA2, #38877C)"
          path="/patient"
        >
          <div className="space-y-1.5">
            <StatusRow
              label="System health"
              value={allHealthy === null ? 'Checking…' : allHealthy ? 'All systems healthy' : 'Issues detected'}
              ok={allHealthy ?? undefined}
            />
            {health && !health.ok && health.checks.filter(c => !c.ok).map(c => (
              <StatusRow key={c.name} label={c.name} value={c.detail} ok={false} />
            ))}
          </div>
        </ProductCard>

        <ProductCard
          title="ERA Comms"
          subtitle="WhatsApp messaging infrastructure, session management, and delivery"
          icon={<MessageSquare className="w-5 h-5" />}
          color="linear-gradient(135deg, #BF7C93, #9E6278)"
          path="/comms"
        >
          <div className="space-y-1.5">
            <StatusRow
              label="Active sessions"
              value={comms ? `${commsActive} of ${commsTotal} connected` : 'Checking…'}
              ok={comms ? commsActive === commsTotal && commsTotal > 0 : undefined}
            />
            {comms && comms.recentAlerts.filter(a => !a.resolved).length > 0 && (
              <StatusRow
                label="Alerts"
                value={`${comms.recentAlerts.filter(a => !a.resolved).length} active`}
                ok={false}
              />
            )}
            {comms && comms.sessions.flagged > 0 && (
              <StatusRow label="Flagged numbers" value={`${comms.sessions.flagged} need attention`} ok={false} />
            )}
          </div>
        </ProductCard>

        <ProductCard
          title="ERA Connect"
          subtitle="Patient-facing booking portal and telehealth integrations"
          icon={<Zap className="w-5 h-5" />}
          color="linear-gradient(135deg, #9b8ae9, #7b6ac9)"
          path="/connect"
          available={false}
        />
      </div>
    </div>
  )
}
