import { AlertTriangle, WifiOff, Smartphone, RefreshCw, ShieldOff, Clock, Server, Link2Off, MessageSquareOff, ChevronDown, ChevronUp, Zap, GitBranch, BatteryWarning, Radio } from 'lucide-react'
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
      'Click the red trash icon (reset credentials) on the session row.',
      'This clears old corrupted WhatsApp credentials.',
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
      'Queued messages will automatically send once the session reconnects — nothing is lost.',
    ],
  },
  {
    icon: <Radio className="w-5 h-5" />,
    color: 'text-sky-400',
    title: 'Some messages send, some don\'t — unreliable delivery',
    symptom: 'Sent 7 messages, only 4 arrived. Delivery feels random.',
    steps: [
      'This is caused by the warmup anti-spam system. New sessions have a daily cap (starts at ~5 messages/day) that ramps up over 30 days.',
      'Check the Event Log for "Message blocked — daily warmup cap reached" events.',
      'If the cap is hit, no more messages go out that day — they will be retried tomorrow.',
      'To increase the cap faster, go to the session warmup settings and advance the warmup day.',
      'For operator test messages (Send button in Sessions), they bypass warmup and should always arrive within seconds.',
      'If the session is connected but messages still randomly fail, check the Event Log filter "Messages" for message_failed entries with the error detail.',
    ],
  },
  {
    icon: <Zap className="w-5 h-5" />,
    color: 'text-yellow-300',
    title: 'Termux logs show ETIMEDOUT or CONNECT_TIMEOUT errors',
    symptom: 'Lots of "connect ETIMEDOUT" or "write CONNECT_TIMEOUT" in the logs — workers restarting.',
    steps: [
      'These are caused by brief mobile network blips — Redis or Supabase timing out for a second.',
      'The app now handles these safely — workers log a warning and keep running instead of crashing.',
      'If you see workers crashing repeatedly, the phone may have no internet or Redis may be down.',
      'Check internet: ping google.com in Termux.',
      'Check Redis is running: redis-cli ping  (should reply PONG).',
      'If Redis is not running: redis-server --daemonize yes',
      'Once internet and Redis are back, sessions reconnect automatically.',
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
      'If you just pulled a code update: git pull && npm run build && npm start',
    ],
  },
  {
    icon: <GitBranch className="w-5 h-5" />,
    color: 'text-emerald-400',
    title: 'Installing a code update',
    symptom: 'You\'ve been told to pull an update — not sure what commands to run.',
    steps: [
      'In Termux (in the era-comms directory), run this single command:',
      'git pull && npm run build && npm start',
      'It will download the update, rebuild, and restart automatically.',
      'After it starts, your sessions will reconnect and be ready within 30 seconds.',
      'You do NOT need to touch zrok — it keeps running in its own session.',
    ],
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'text-red-300',
    title: 'Android killed Termux in the background',
    symptom: 'Everything was working, then stopped after a few hours with screen off.',
    steps: [
      'Go to Android Settings → Apps → Termux → Battery → set to Unrestricted.',
      'Also go to Android Settings → Battery → Background app restrictions → allow Termux.',
      'Keep the phone plugged in to a charger at all times.',
      'Restart era-comms: cd ~/era-comms && npm start',
      'Restart zrok in a second Termux session: zrok share public 3000',
    ],
  },
  {
    icon: <BatteryWarning className="w-5 h-5" />,
    color: 'text-orange-300',
    title: 'Keeping it running 24/7',
    symptom: 'Sessions keep going offline overnight or when you\'re not watching.',
    steps: [
      'Set Termux battery to Unrestricted (see "Android killed Termux" above).',
      'Keep the phone on charge. A low battery triggers aggressive background killing.',
      'Use a WiFi connection — mobile data can drop silently.',
      'In Termux, install a wake lock: termux-wake-lock  (keeps CPU alive).',
      'Consider running era-comms with pm2: npm install -g pm2 && pm2 start dist/index.js --name era-comms && pm2 startup  (auto-restarts if it crashes).',
      'Check the Sessions page every morning and hit Refresh — green = good.',
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
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">Failsafe Guide</h1>
        <p className="caption mt-0.5">Things that can go wrong with ERA Comms and exactly what to do. Click any issue to expand.</p>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/05 px-5 py-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-300">Quick checklist — check these first</p>
          <ol className="text-xs text-white/60 mt-2 space-y-1 list-decimal list-inside">
            <li>Is the phone connected to internet (WiFi or data)?</li>
            <li>Is Termux open and showing era-comms running (not a blank $ prompt)?</li>
            <li>Is zrok running in a second Termux session?</li>
            <li>Does the zrok URL in ERA Hub → Settings match what zrok shows?</li>
            <li>Does the session show Connected (green) on the Sessions page?</li>
          </ol>
        </div>
      </div>

      <div className="rounded-2xl border border-white/07 bg-card px-5 py-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">One command to restart everything</p>
        <code className="block bg-black/40 rounded-xl px-4 py-3 text-sm text-teal font-mono">
          cd ~/era-comms && git pull && npm run build && npm start
        </code>
        <p className="text-xs text-white/40 mt-2">Run this in Termux any time something goes wrong. It pulls the latest code, rebuilds, and restarts.</p>
      </div>

      <div className="space-y-3">
        {ISSUES.map((issue) => (
          <IssueCard key={issue.title} issue={issue} />
        ))}
      </div>
    </div>
  )
}
