import { useState, useEffect } from 'react'
import { RefreshCw, Radio, Users, Mail, MessageSquare, History, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { patientApi, HospitalUsageStat } from '../../lib/patient-api'
import { pageCache } from '../../lib/cache'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getTier(avg: number) {
  if (avg >= 100) return { label: 'Large', color: 'text-purple-400' }
  if (avg >= 41)  return { label: 'Big',   color: 'text-orange-400' }
  if (avg >= 21)  return { label: 'Mid',   color: 'text-blue-400' }
  if (avg >= 1)   return { label: 'Small', color: 'text-[#CC7896]' }
  return               { label: '—',     color: 'text-muted-foreground/25' }
}

function recentAvg(history: HospitalUsageStat['history']): number {
  return history[history.length - 1]?.avgPatientsDay ?? 0
}

function fmt(n: number) {
  if (!n || n === 0) return '—'
  if (n < 0.1) return '<0.1'
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

function fmtDays(d: number) {
  if (d < 30)  return `${d}d`
  if (d < 365) return `${Math.floor(d / 30)}mo`
  const y = Math.floor(d / 365), m = Math.floor((d % 365) / 30)
  return m > 0 ? `${y}y ${m}mo` : `${y}y`
}

const TIER_DEFS = [
  { label: 'Large', range: '100+/d',  color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20' },
  { label: 'Big',   range: '41–99/d', color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20' },
  { label: 'Mid',   range: '21–40/d', color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  { label: 'Small', range: '1–20/d',  color: 'text-[#CC7896]', bg: 'bg-[#CC7896]/10 border-[#CC7896]/20' },
  { label: '—',     range: 'no data', color: 'text-muted-foreground/40', bg: 'bg-white/5 border-border' },
]

type ViewTab = 'live' | 'history'
const COLS_PER_PAGE = 6

export function Usage() {
  const [tab, setTab] = useState<ViewTab>('live')
  const [stats, setStats] = useState<HospitalUsageStat[]>(() => pageCache.get<HospitalUsageStat[]>('patient:usage') ?? [])
  const [loading, setLoading] = useState(() => !pageCache.get('patient:usage'))
  const [fetching, setFetching] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const now = new Date()
  const currentMonthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`
  const SYSTEM_START = new Date(2026, 4, 1)
  const monthsSinceStart = (now.getFullYear() - SYSTEM_START.getFullYear()) * 12 + (now.getMonth() - SYSTEM_START.getMonth())
  const MIN_WINDOW_OFFSET = COLS_PER_PAGE - monthsSinceStart
  const [windowOffset, setWindowOffset] = useState(() => Math.max(1, MIN_WINDOW_OFFSET))

  const visibleMonths: string[] = Array.from({ length: COLS_PER_PAGE }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - COLS_PER_PAGE + windowOffset + i, 1)
    return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
  })

  const isFutureMonth = (label: string) => {
    const [mName, yr] = label.split(' ')
    const mIdx = MONTH_NAMES.indexOf(mName)
    const y = parseInt(yr)
    return y > now.getFullYear() || (y === now.getFullYear() && mIdx > now.getMonth())
  }
  const isCurrentMonth = (label: string) => label === currentMonthLabel

  const load = async () => {
    setFetching(true)
    try {
      const data = await patientApi.usageStats()
      const filtered = (data.stats ?? []).filter(s => s?.currentMonth)
      pageCache.set('patient:usage', filtered)
      setStats(filtered)
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch { /* ignore */ }
    finally { setLoading(false); setFetching(false) }
  }

  useEffect(() => { void load() }, [])
  useEffect(() => {
    const id = setInterval(load, 2 * 60_000)
    return () => clearInterval(id)
  }, [])

  const sorted = [...stats].sort((a, b) => recentAvg(b.history) - recentAvg(a.history))
  const tierCounts = stats.reduce<Record<string, number>>((acc, h) => {
    const { label } = getTier(recentAvg(h.history))
    acc[label] = (acc[label] ?? 0) + 1
    return acc
  }, {})

  const calendarDayToday = now.getDate()
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page-title">Hospital Usage</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#CC7896]/10 border border-[#CC7896]/20 text-[10px] font-semibold text-[#CC7896] uppercase tracking-wide">
              <Radio className="w-2.5 h-2.5" /> Live
            </span>
          </div>
          {lastUpdated && <p className="text-[11px] text-muted-foreground/35 mt-1">Last updated: {lastUpdated} · auto-refreshes every 2 min</p>}
        </div>
        <button onClick={() => void load()} disabled={fetching}
          className="shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium text-muted-foreground border border-border hover:text-foreground hover:bg-white/5 transition disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tier strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {TIER_DEFS.map(t => (
          <div key={t.label} className={`rounded-xl border ${t.bg} px-4 py-3`}>
            <p className={`text-2xl font-bold tabular-nums ${t.color}`}>{loading ? '—' : (tierCounts[t.label] ?? 0)}</p>
            <p className={`text-xs font-semibold mt-0.5 ${t.color}`}>{t.label}</p>
            <p className="text-[10px] text-muted-foreground/40 mt-0.5">{t.range}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border gap-1">
        {([['live', 'Live — ' + currentMonthLabel, Zap], ['history', 'History', History]] as const).map(([key, lbl, Icon]) => (
          <button key={key} onClick={() => setTab(key as ViewTab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${tab === key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <Icon className="w-3.5 h-3.5" />{lbl}
          </button>
        ))}
      </div>

      {/* LIVE TAB */}
      {tab === 'live' && (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <div className="px-4 py-2.5 border-b border-border flex items-center gap-3 flex-wrap bg-white/[0.04]">
            <Zap className="w-3.5 h-3.5 text-primary/60 shrink-0" />
            <span className="text-xs font-semibold text-foreground">{MONTH_SHORT[now.getMonth()]} '{String(now.getFullYear()).slice(2)}</span>
            <span className="text-[11px] text-muted-foreground/40">Day {calendarDayToday} of {daysInCurrentMonth} · resets 1st</span>
            <div className="ml-auto hidden sm:flex items-center gap-4 text-[10px] text-muted-foreground/35">
              <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" /> Patients</span>
              <span className="flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> Emails</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-2.5 h-2.5" /> SMS</span>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground/50">Loading…</div>
          ) : (
            <table className="w-full text-xs" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 580 }}>
              <colgroup>
                <col style={{ width: 190 }} /><col style={{ width: 72 }} /><col style={{ width: 80 }} />
                <col /><col /><col />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderBottom: '2px solid rgba(255,255,255,0.12)' }}>
                  {[['Hospital','left',14], ['Tier','left',10], ['Since','left',10]].map(([h, a, px]) => (
                    <th key={h as string} style={{ padding: `9px ${px}px`, textAlign: a as 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                  ))}
                  {['Pts · avg/day', 'Em · avg/day', 'SMS · avg/day'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'right', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', borderLeft: '1px solid rgba(255,255,255,0.10)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((h, hi) => {
                  const tier = getTier(recentAvg(h.history))
                  const cm = h.currentMonth
                  const rowBg = hi % 2 === 0 ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0.02)'
                  return (
                    <tr key={h.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', backgroundColor: rowBg }}>
                      <td style={{ padding: '10px 14px', background: hi % 2 === 0 ? 'rgb(24,24,24)' : 'rgb(26,26,26)', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${h.active ? 'bg-[#CC7896]' : 'bg-muted-foreground/25'}`} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.88)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 10px' }}><span className={`text-[10px] font-semibold ${tier.color}`}>{tier.label}</span></td>
                      <td style={{ padding: '10px 10px' }}><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{fmtDays(h.daysSince)}</span></td>
                      {[{ val: cm.avgPatientsDay, total: cm.patients }, { val: cm.avgEmailsDay, total: cm.emails }, { val: cm.avgSmsDay, total: cm.sms }].map((d, i) => (
                        <td key={i} style={{ padding: '10px 12px', textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                          <span className="tabular-nums font-semibold" style={{ fontSize: 13, color: d.val > 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)' }}>{fmt(d.val)}</span>
                          {d.total > 0 && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{d.total} this month</div>}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <div className="px-5 py-2.5 border-b border-border flex items-center gap-3 bg-white/[0.04] flex-wrap">
            <History className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            <span className="text-xs font-semibold text-foreground">History</span>
            <span className="text-[11px] text-muted-foreground/40">Avg/day that month</span>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => setWindowOffset(o => Math.max(MIN_WINDOW_OFFSET, o - COLS_PER_PAGE))}
                disabled={windowOffset <= MIN_WINDOW_OFFSET}
                className="flex items-center gap-1 px-2 h-7 rounded text-[11px] font-medium text-muted-foreground border border-border hover:text-foreground hover:bg-white/5 transition disabled:opacity-25">
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
              <span className="text-[11px] text-muted-foreground/40 px-2 tabular-nums">{visibleMonths[0]} – {visibleMonths[visibleMonths.length - 1]}</span>
              <button onClick={() => setWindowOffset(o => o + COLS_PER_PAGE)} disabled={windowOffset >= 1}
                className="flex items-center gap-1 px-2 h-7 rounded text-[11px] font-medium text-muted-foreground border border-border hover:text-foreground hover:bg-white/5 transition disabled:opacity-25">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground/50">Loading…</div>
          ) : (
            <table className="text-xs w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 680 }}>
              <colgroup><col style={{ width: 200 }} />{visibleMonths.map(m => <col key={m} />)}</colgroup>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderBottom: '2px solid rgba(255,255,255,0.16)' }}>
                  <th className="text-left" style={{ padding: '10px 14px', background: 'rgba(24,24,24,1)', borderRight: '3px solid rgba(255,255,255,0.22)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>Hospital</th>
                  {visibleMonths.map(label => {
                    const isCur = isCurrentMonth(label), isFut = isFutureMonth(label)
                    return (
                      <th key={label} className="text-center" style={{ padding: '10px 6px', borderLeft: isCur ? '3px solid rgba(99,200,255,0.55)' : '1px solid rgba(255,255,255,0.10)', fontSize: 10, fontWeight: 700, color: isFut ? 'rgba(255,255,255,0.25)' : isCur ? 'rgba(130,210,255,0.9)' : 'rgba(255,255,255,0.65)', backgroundColor: isCur ? 'rgba(99,200,255,0.05)' : 'transparent', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 90 }}>
                        {(() => { const [mn, yr] = label.split(' '); return `${MONTH_SHORT[MONTH_NAMES.indexOf(mn)]} '${yr.slice(2)}` })()}
                      </th>
                    )
                  })}
                </tr>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
                  <th style={{ background: 'rgba(24,24,24,1)', borderRight: '3px solid rgba(255,255,255,0.22)', padding: '4px 14px' }} />
                  {visibleMonths.map(label => {
                    const isCur = isCurrentMonth(label), isFut = isFutureMonth(label)
                    return (
                      <th key={label} style={{ borderLeft: isCur ? '3px solid rgba(99,200,255,0.55)' : '1px solid rgba(255,255,255,0.10)', padding: '4px 0', backgroundColor: isCur ? 'rgba(99,200,255,0.04)' : 'transparent' }}>
                        <div className="flex justify-around px-2" style={{ fontSize: 9, fontWeight: 600, color: isFut ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.28)', letterSpacing: '0.04em' }}>
                          <span>Pts</span><span>Em</span><span>SMS</span>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {sorted.map((h, hi) => {
                  const tier = getTier(recentAvg(h.history))
                  const rowBg = hi % 2 === 0 ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0.02)'
                  const snapByLabel = new Map([...(h.history ?? []).map(s => [s.label, s] as const), ...(h.currentMonth ? [[h.currentMonth.label, h.currentMonth] as const] : [])])
                  const windowSnaps = visibleMonths.map(label => snapByLabel.get(label) ?? null)
                  return (
                    <tr key={h.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: rowBg }}>
                      <td style={{ padding: '9px 14px', width: 180, background: hi % 2 === 0 ? 'rgb(24,24,24)' : 'rgb(26,26,26)', borderRight: '3px solid rgba(255,255,255,0.22)', overflow: 'hidden' }}>
                        <div className="flex items-center gap-1.5" style={{ overflow: 'hidden' }}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${h.active ? 'bg-[#CC7896]' : 'bg-muted-foreground/25'}`} />
                          <span className="font-semibold text-foreground" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 pl-3">
                          <span className={`font-semibold shrink-0 ${tier.color}`} style={{ fontSize: 9 }}>{tier.label}</span>
                          <span className="text-muted-foreground/35 shrink-0" style={{ fontSize: 9 }}>{fmtDays(h.daysSince)}</span>
                        </div>
                      </td>
                      {windowSnaps.map((snap, mi) => {
                        const noData = !snap || (snap.patients === 0 && snap.emails === 0 && snap.sms === 0)
                        return (
                          <td key={mi} className="text-center tabular-nums" style={{ padding: '8px 4px', borderLeft: '1px solid rgba(255,255,255,0.08)', verticalAlign: 'middle' }}>
                            {noData ? <span style={{ color: 'rgba(255,255,255,0.08)', fontSize: 16 }}>·</span> : (
                              <div className="flex justify-around px-1 gap-1">
                                <span className="font-semibold" style={{ fontSize: 12, color: snap!.avgPatientsDay > 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.12)', minWidth: 24, textAlign: 'center' }}>{fmt(snap!.avgPatientsDay)}</span>
                                <span style={{ fontSize: 11, color: snap!.avgEmailsDay > 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.10)', minWidth: 22, textAlign: 'center' }}>{fmt(snap!.avgEmailsDay)}</span>
                                <span style={{ fontSize: 11, color: snap!.avgSmsDay > 0 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.10)', minWidth: 20, textAlign: 'center' }}>{fmt(snap!.avgSmsDay)}</span>
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/30 pb-2">
        {tab === 'live'
          ? 'Live tab resets on the 1st · Avg/day = total so far ÷ days elapsed · Test automations excluded'
          : 'History = avg/day during that specific month · Tier = previous completed month · A rising number = hospital is growing'}
      </p>
    </div>
  )
}
