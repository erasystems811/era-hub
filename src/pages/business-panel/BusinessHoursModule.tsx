import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { bizApi, type BusinessHours, type DayHours } from './business-api'

type DayKey = keyof BusinessHours
const DAYS: { key: DayKey; label: string }[] = [
  { key: 'monday',    label: 'Monday'    },
  { key: 'tuesday',   label: 'Tuesday'   },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday',  label: 'Thursday'  },
  { key: 'friday',    label: 'Friday'    },
  { key: 'saturday',  label: 'Saturday'  },
  { key: 'sunday',    label: 'Sunday'    },
]

const WEEKDAYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

function genTimes(): string[] {
  const times: string[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      times.push(`${hh}:${mm}`)
    }
  }
  return times
}
const TIMES = genTimes()

const DEFAULT_HOURS: BusinessHours = {
  monday:    { open: true,  from: '08:00', to: '17:00' },
  tuesday:   { open: true,  from: '08:00', to: '17:00' },
  wednesday: { open: true,  from: '08:00', to: '17:00' },
  thursday:  { open: true,  from: '08:00', to: '17:00' },
  friday:    { open: true,  from: '08:00', to: '17:00' },
  saturday:  { open: false, from: '08:00', to: '13:00' },
  sunday:    { open: false, from: '08:00', to: '13:00' },
}

const INPUT  = 'w-full px-3.5 py-2.5 rounded-xl bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#BF7C93]/50 focus:ring-2 focus:ring-[#BF7C93]/15 transition-all'
const LABEL  = 'text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block'
const SELECT = 'px-2 py-1.5 rounded-lg bg-[hsl(262_20%_11%)] border border-white/[0.10] text-foreground text-xs focus:outline-none focus:border-[#BF7C93]/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed'

const AFTER_HOURS_TAGS = ['{open_time}', '{business_name}']

export function BusinessHoursModule() {
  const [hours,         setHours]         = useState<BusinessHours>(DEFAULT_HOURS)
  const [afterMsg,      setAfterMsg]      = useState('')
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [toast,         setToast]         = useState<{ text: string; ok: boolean } | null>(null)

  function showToast(text: string, ok = true) {
    setToast({ text, ok })
    setTimeout(() => setToast(null), 2600)
  }

  useEffect(() => {
    bizApi.getBusinessHours()
      .then(h => setHours(h))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function updateDay(day: DayKey, patch: Partial<DayHours>) {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], ...patch } }))
  }

  function applyMondayToWeekdays() {
    const mon = hours.monday
    setHours(prev => {
      const next = { ...prev }
      WEEKDAYS.forEach(k => { next[k] = { ...mon } })
      return next
    })
  }

  function copySameAsMonday(day: DayKey) {
    setHours(prev => ({ ...prev, [day]: { ...prev.monday } }))
  }

  function insertTag(tag: string) {
    setAfterMsg(prev => prev + tag)
  }

  async function save() {
    setSaving(true)
    try {
      await bizApi.updateBusinessHours(hours)
      showToast('Business hours saved')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to save', false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-[#BF7C93]/30 border-t-[#BF7C93] animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl border text-sm shadow-xl"
          style={{
            background: 'hsl(262 20% 14%)',
            borderColor: toast.ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)',
            color: toast.ok ? '#86efac' : '#fca5a5',
          }}
        >
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-foreground">Business Hours</h1>
        <p className="text-sm text-muted-foreground mt-0.5">When your AI is active and how it behaves outside hours</p>
      </div>

      {/* Hours table */}
      <div
        className="rounded-xl border overflow-hidden mb-4"
        style={{ background: 'hsl(262 20% 10%)', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        {/* Apply all weekdays button */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <p className="text-xs font-semibold text-foreground">Weekly Schedule</p>
          <button
            onClick={applyMondayToWeekdays}
            className="text-xs text-[#BF7C93]/70 hover:text-[#BF7C93] transition-colors"
          >
            Apply Monday hours to all weekdays
          </button>
        </div>

        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {DAYS.map(({ key, label }) => {
            const day = hours[key]
            return (
              <div
                key={key}
                className={`flex items-center gap-4 px-5 py-3 transition-colors ${day.open ? '' : 'opacity-60'}`}
              >
                {/* Day + toggle */}
                <div className="w-24 shrink-0">
                  <p className="text-xs font-medium text-foreground">{label}</p>
                </div>

                {/* Toggle */}
                <button
                  role="switch"
                  aria-checked={day.open}
                  onClick={() => updateDay(key, { open: !day.open })}
                  className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors"
                  style={{ background: day.open ? '#BF7C93' : 'rgba(255,255,255,0.12)' }}
                >
                  <span
                    className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
                    style={{ transform: day.open ? 'translateX(16px)' : 'translateX(0)' }}
                  />
                </button>

                <span className="text-xs w-10 shrink-0" style={{ color: day.open ? '#4AA89D' : 'rgba(255,255,255,0.3)' }}>
                  {day.open ? 'Open' : 'Closed'}
                </span>

                {/* Time pickers */}
                <div className="flex items-center gap-2 flex-1">
                  <select
                    value={day.from}
                    disabled={!day.open}
                    onChange={e => updateDay(key, { from: e.target.value })}
                    className={SELECT}
                  >
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-xs text-muted-foreground/50">to</span>
                  <select
                    value={day.to}
                    disabled={!day.open}
                    onChange={e => updateDay(key, { to: e.target.value })}
                    className={SELECT}
                  >
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Copy from Monday */}
                {key !== 'monday' && (
                  <button
                    onClick={() => copySameAsMonday(key)}
                    className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0 hidden sm:block"
                  >
                    Same as Mon
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Outside hours message */}
      <div
        className="p-5 rounded-xl border mb-5"
        style={{ background: 'hsl(262 20% 10%)', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <label className={LABEL}>What AI says when customer messages outside hours</label>

        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground/50">Insert:</span>
          {AFTER_HOURS_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => insertTag(tag)}
              className="px-2 py-0.5 rounded text-[11px] font-mono transition-all hover:bg-[#BF7C93]/15"
              style={{ background: 'rgba(191,124,147,0.08)', color: '#BF7C93' }}
            >
              {tag}
            </button>
          ))}
        </div>

        <textarea
          className={`${INPUT} resize-none`}
          rows={3}
          value={afterMsg}
          onChange={e => setAfterMsg(e.target.value)}
          placeholder={`Hi! We're currently closed. We'll be back at {open_time}. Leave a message and we'll get back to you!`}
        />
      </div>

      {/* Save button */}
      <button
        onClick={save}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#BF7C93] text-white text-sm font-bold hover:bg-[#BF7C93]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saving ? 'Saving…' : 'Save hours'}
      </button>
    </div>
  )
}
