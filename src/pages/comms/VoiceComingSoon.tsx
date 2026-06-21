import { Phone, Voicemail, PhoneIncoming, PhoneOutgoing, Mic, Hash } from 'lucide-react'

const FEATURES = [
  {
    icon: PhoneIncoming,
    title: 'Inbound calls',
    description: 'Route calls to agents, departments, or IVR trees — per client, per number.',
  },
  {
    icon: PhoneOutgoing,
    title: 'Outbound campaigns',
    description: 'Automated voice campaigns for reminders, appointments, and notifications.',
  },
  {
    icon: Voicemail,
    title: 'Voicemail & recording',
    description: 'Capture voicemails and call recordings with transcription.',
  },
  {
    icon: Hash,
    title: 'Virtual numbers',
    description: 'Each business gets their own dedicated number, fully isolated.',
  },
  {
    icon: Mic,
    title: 'IVR builder',
    description: 'Drag-and-drop call flow builder — no developer needed.',
  },
  {
    icon: Phone,
    title: 'Call analytics',
    description: 'Duration, wait time, abandon rate and custom tags — all in one place.',
  },
]

export function VoiceComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      {/* Icon */}
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{
          background: 'linear-gradient(135deg, rgba(204,120,150,0.15), rgba(77,191,179,0.12))',
          border: '1px solid rgba(204,120,150,0.20)',
        }}
      >
        <Phone className="w-9 h-9" style={{ color: '#CC7896' }} />
      </div>

      {/* Badge */}
      <div className="mb-4 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Coming soon
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">ERA Comms Voice</h1>
      <p className="text-muted-foreground max-w-md text-base leading-relaxed mb-12">
        The same self-owned infrastructure model — but for voice. Your VoIP engine, your numbers, your call flows.
        No Twilio, no third party.
      </p>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl text-left">
        {FEATURES.map(f => (
          <div
            key={f.title}
            className="rounded-2xl border border-white/07 bg-card p-5 flex gap-4 opacity-75"
          >
            <div
              className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
              style={{ background: 'rgba(204,120,150,0.10)', border: '1px solid rgba(204,120,150,0.12)' }}
            >
              <f.icon className="w-4.5 h-4.5" style={{ color: '#CC7896' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-0.5">{f.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
