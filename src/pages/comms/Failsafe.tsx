import { AlertTriangle, WifiOff, Smartphone, RefreshCw, ShieldOff, Clock, Server, Link2Off, MessageSquareOff, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface Issue {
  icon: JSX.Element
  color: string
  title: string
  symptom: string
  steps: string[]
}

const ISSUES: Issue[] = [
  {
    icon: <WifiOff className="w-5 h-5" />,
    color: 'text-amber-400',
    title: 'Phone lost internet / data ran out',
    symptom: 'ERA Hub shows "Connection to session server closed" or sessions go grey/offline.',
    steps: [
      'Reconnect the phone to WiFi or top up data.',
      'Open Termux on the phone.',
      'Run: cd ~/era-comms && npm start',
      'In a second Termux session run: zrok share public 3000',
      'If the zrok URL changed, update it in ERA Hub → Settings → Comms API URL.',
      'Sessions should reconnect automatically within 30 seconds.',
    ],
  },
  {
    icon: <Smartphone className="w-5 h-5" />,
    color: 'text-blue-400',
    title: 'Phone was restarted or switched off',
    symptom: 'ERA Hub cannot reach the server at all. Sessions all show offline.',
    steps: [
      'Open Termux on the phone (it does not auto-start).',
      'Run: cd ~/era-comms && npm start',
      'Open a second Termux session (swipe from left edge → New Session).',
      'Run: zrok share public 3000',
      'Wait ~30 seconds, sessions should reconnect.',
      'If zrok shows a NEW URL, update it in ERA Hub → Settings → Comms API URL.',
    ],
  },
  {
    icon: <Link2Off className="w-5 h-5" />,
    color: 'text-purple-400',
    title: 'zrok tunnel went down (URL stopped working)',
    symptom: 'ERA Hub says it cannot reach ERA Comms even though npm start is running.',
    steps: [
      'In Termux, open a new session.',
      'Run: zrok share public 3000',
      'Copy the new URL shown (e.g. https://xxxxx.share.zrok.io).',
      'In ERA Hub → Settings → Comms API URL, paste the new URL and save.',
      'Refresh the Sessions page — it should load again.',
    ],
  },
  {
    icon: <ShieldOff className="w-5 h-5" />,
    color: 'text-red-400',
    title: 'Session shows as "Banned"',
    symptom: 'Session row shows banned in red. Messages cannot be sent.',
    steps: [
      'This usually means WhatsApp logged out the session — it is NOT a real ban.',
      'Click the Unban button (amber text) on the session row.',
      'Click the # button on the session to get a pairing code.',
      'Enter the code in WhatsApp on the dedicated phone → Linked Devices → Link with phone number.',
      'Session should turn Connected (green) within a few seconds.',
    ],
  },
  {
    icon: <RefreshCw className="w-5 h-5" />,
    color: 'text-teal-400',
    title: 'Session stuck on "Disconnected" — won\'t reconnect',
    symptom: 'Session shows disconnected and clicking Reconnect does nothing.',
    steps: [
      'Click the amber Reset button (circular arrow icon) on the session row.',
      'This clears old corrupted credentials.',
      'Then click the # button and enter a fresh pairing code.',
      'If it still fails, stop the session (red X), create a new one with the same number, and link again.',
    ],
  },
  {
    icon: <MessageSquareOff className="w-5 h-5" />,
    color: 'text-orange-400',
    title: 'Messages are queued but not sending',
    symptom: 'Message status stays "queued" and never becomes "sent".',
    steps: [
      'Check the Sessions page — the session must show Connected (green).',
      'If disconnected, reconnect it first (see above).',
      'Check Termux — era-comms must be running (you should see a $ prompt only if it crashed).',
      'If era-comms crashed, run: cd ~/era-comms && npm start',
      'Queued messages will automatically send once the session reconnects.',
    ],
  },
  {
    icon: <Clock className="w-5 h-5" />,
    color: 'text-yellow-400',
    title: 'Pairing code request timed out',
    symptom: 'Error: "Pairing code request timed out" when clicking the # button.',
    steps: [
      'era-comms on the phone is probably not running.',
      'Open Termux and run: cd ~/era-comms && npm start',
      'Wait for it to fully start (you\'ll see "Server listening on port 3000").',
      'Try the # button again.',
    ],
  },
  {
    icon: <Server className="w-5 h-5" />,
    color: 'text-pink-400',
    title: 'era-comms crashed / Termux shows an error',
    symptom: 'Termux shows an error message or just a $ prompt with nothing running.',
    steps: [
      'Run: cd ~/era-comms && npm start',
      'If you see "address already in use", run: pkill node   then try again.',
      'If you see a build error, run: npm run build   first, then npm start.',
      'If git pull is needed for updates: git pull && npm run build && npm start',
    ],
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'text-red-300',
    title: 'Android killed Termux in the background',
    symptom: 'Everything was working, then stopped after a few hours with screen off.',
    steps: [
      'Go to Android Settings → Apps → Termux → Battery → set to Unrestricted (No restrictions).',
      'Keep the phone plugged in to a charger.',
      'Restart era-comms: cd ~/era-comms && npm start',
      'Restart zrok in a second Termux session: zrok share public 3000',
      'To prevent this permanently, consider keeping the screen on or using a WiFi-only SIM so Android treats it as a server device.',
    ],
  },
]

function IssueCard({ issue }: { issue: Issue }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-white/07 bg-card overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition"
        onClick={() => setOpen(o => !o)}>
        <span className={issue.color}>{issue.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{issue.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{issue.symptom}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground/40 shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-white/07 px-5 py-4 bg-black/10">
          <p className="text-xs text-white/50 mb-3 italic">"{issue.symptom}"</p>
          <ol className="space-y-2">
            {issue.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className={`font-bold shrink-0 ${issue.color}`}>{i + 1}.</span>
                <span className="text-white/70">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

export function Failsafe() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Failsafe Guide</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Things that can go wrong with ERA Comms and exactly what to do. Click any issue to expand.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/05 px-5 py-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-300">Quick checklist if anything stops working</p>
          <ol className="text-xs text-white/60 mt-2 space-y-1 list-decimal list-inside">
            <li>Is the phone connected to internet (WiFi or data)?</li>
            <li>Is Termux open and showing era-comms running?</li>
            <li>Is zrok running in a second Termux session?</li>
            <li>Does the zrok URL in ERA Hub Settings match what zrok shows?</li>
            <li>Does the session show Connected (green) on the Sessions page?</li>
          </ol>
        </div>
      </div>

      <div className="space-y-3">
        {ISSUES.map((issue) => (
          <IssueCard key={issue.title} issue={issue} />
        ))}
      </div>
    </div>
  )
}
