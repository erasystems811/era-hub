import { useEffect, useState } from 'react'
import { structureApi, Question, BusinessType } from '../../lib/structure-api'
import { Plus, Save, Trash2, Sparkles } from 'lucide-react'

const INPUT_TYPES = ['short-text', 'number', 'dropdown', 'yes-no', 'multi-select', 'voice-note'] as const

export function StructureQuestions() {
  const [types, setTypes] = useState<BusinessType[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [layer, setLayer] = useState<1 | 2>(1)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [addingType, setAddingType] = useState(false)
  const [error, setError] = useState('')
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    structureApi.listBusinessTypes().then(t => {
      setTypes(t)
      if (t.length > 0) setSelectedTypeId(t[0].id)
    }).catch(e => setError(e.message))
  }, [])

  useEffect(() => {
    if (!selectedTypeId) return
    setLoading(true)
    structureApi.listQuestions(selectedTypeId, layer)
      .then(setQuestions)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedTypeId, layer])

  const updateQuestion = (id: string, changes: Partial<Question>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...changes } : q))
  }

  const saveQuestion = async (q: Question) => {
    try {
      await structureApi.updateQuestion(q.id, { question_text: q.question_text, input_type: q.input_type, options: q.options, block: q.block })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    }
  }

  const deleteQuestion = async (id: string) => {
    try {
      await structureApi.deleteQuestion(id)
      setQuestions(prev => prev.filter(q => q.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const addQuestion = async () => {
    if (!selectedTypeId) return
    try {
      const q = await structureApi.createQuestion({
        business_type_id: selectedTypeId,
        layer,
        block: 'A',
        question_text: 'New question',
        input_type: 'short-text',
        options: null,
        order_index: questions.length + 1,
      })
      setQuestions(prev => [...prev, q])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }

  const handleSeed = async () => {
    if (!selectedTypeId) return
    if (!confirm('This will replace ALL existing questions for this business type with the default 78-question set. Continue?')) return
    setSeeding(true)
    try {
      const result = await structureApi.seedQuestions(selectedTypeId)
      setError('')
      // Reload questions
      const qs = await structureApi.listQuestions(selectedTypeId, layer)
      setQuestions(qs)
      alert(`Done — ${result.inserted} questions loaded.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Seed failed')
    } finally {
      setSeeding(false)
    }
  }

  const addType = async () => {
    if (!newTypeName.trim()) return
    setAddingType(true)
    try {
      const t = await structureApi.createBusinessType(newTypeName.trim())
      setTypes(prev => [...prev, t])
      setSelectedTypeId(t.id)
      setNewTypeName('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setAddingType(false)
    }
  }

  const grouped = questions.reduce((acc, q) => {
    const block = q.block || 'A'
    if (!acc[block]) acc[block] = []
    acc[block].push(q)
    return acc
  }, {} as Record<string, Question[]>)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-foreground">Questions</h1>
        <p className="text-xs text-muted-foreground/50 mt-0.5">Edit the audit question bank per business type</p>
      </div>

      {error && <div className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">{error}</div>}

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedTypeId}
          onChange={e => setSelectedTypeId(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm bg-white/[0.05] border border-white/10 text-foreground focus:outline-none focus:border-[#C9952B]/50"
        >
          {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <div className="flex rounded-lg border border-white/10 overflow-hidden">
          {([1, 2] as const).map(l => (
            <button key={l} onClick={() => setLayer(l)}
              className={`px-4 py-1.5 text-sm font-medium transition ${layer === l ? 'bg-[#C9952B] text-background' : 'text-muted-foreground/60 hover:text-foreground hover:bg-white/5'}`}>
              Layer {l}
            </button>
          ))}
        </div>

        <button onClick={addQuestion}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-background bg-[#C9952B] hover:bg-[#C9952B]/90 transition">
          <Plus className="w-3.5 h-3.5" /> Add Question
        </button>
        <button onClick={handleSeed} disabled={seeding || !selectedTypeId}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border border-[#C9952B]/40 text-[#C9952B] hover:bg-[#C9952B]/10 disabled:opacity-40 transition">
          <Sparkles className="w-3.5 h-3.5" /> {seeding ? 'Loading…' : 'Seed 78 Questions'}
        </button>
      </div>

      {/* Add business type */}
      <div className="flex gap-2">
        <input
          value={newTypeName}
          onChange={e => setNewTypeName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addType()}
          placeholder="New business type name…"
          className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-white/[0.04] border border-white/08 text-foreground placeholder-muted-foreground/30 focus:outline-none focus:border-[#C9952B]/40"
        />
        <button onClick={addType} disabled={addingType || !newTypeName.trim()}
          className="px-4 py-1.5 rounded-lg text-sm font-semibold border border-[#C9952B]/30 text-[#C9952B] hover:bg-[#C9952B]/10 disabled:opacity-40 transition">
          {addingType ? 'Adding…' : 'Add Type'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-muted-foreground/40">Loading questions…</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground/40">No questions for this type yet. Add one above.</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([block, qs]) => (
            <div key={block} className="rounded-xl border border-white/08 bg-white/[0.03] overflow-hidden">
              <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/06">
                <p className="text-[11px] font-bold tracking-widest uppercase text-[#C9952B]">Block {block}</p>
              </div>
              <div className="divide-y divide-white/05">
                {qs.map(q => (
                  <div key={q.id} className="p-4 space-y-2.5">
                    <div className="flex gap-2">
                      <input
                        value={q.question_text}
                        onChange={e => updateQuestion(q.id, { question_text: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-white/[0.05] border border-white/10 text-foreground focus:outline-none focus:border-[#C9952B]/50"
                      />
                      <select
                        value={q.input_type}
                        onChange={e => updateQuestion(q.id, { input_type: e.target.value as Question['input_type'] })}
                        className="px-2 py-1.5 rounded-lg text-xs bg-white/[0.05] border border-white/10 text-muted-foreground/70 focus:outline-none focus:border-[#C9952B]/40"
                      >
                        {INPUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input
                        value={q.block}
                        onChange={e => updateQuestion(q.id, { block: e.target.value.toUpperCase() })}
                        placeholder="Block"
                        className="w-14 px-2 py-1.5 rounded-lg text-xs bg-white/[0.05] border border-white/10 text-muted-foreground/70 text-center focus:outline-none focus:border-[#C9952B]/40"
                      />
                    </div>
                    {(q.input_type === 'dropdown' || q.input_type === 'multi-select') && (
                      <input
                        value={q.options?.join(', ') ?? ''}
                        onChange={e => updateQuestion(q.id, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="Options: Yes, No, Sometimes…"
                        className="w-full px-3 py-1.5 rounded-lg text-sm bg-white/[0.05] border border-white/10 text-muted-foreground/70 placeholder-muted-foreground/30 focus:outline-none focus:border-[#C9952B]/40"
                      />
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => saveQuestion(q)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold text-[#C9952B] border border-[#C9952B]/25 hover:bg-[#C9952B]/10 transition">
                        <Save className="w-3 h-3" /> Save
                      </button>
                      <button onClick={() => deleteQuestion(q.id)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] text-muted-foreground/50 border border-white/08 hover:text-red-400 hover:border-red-500/20 transition">
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
