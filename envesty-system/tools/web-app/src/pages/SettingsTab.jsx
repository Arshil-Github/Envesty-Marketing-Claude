import { useEffect, useState } from 'react'

export default function SettingsTab() {
  const [subs, setSubs] = useState({ list: [], default_sorts: ['new'], default_target_count: 50 })
  const [sys, setSys] = useState(null)
  const [ai, setAI] = useState(null)
  const [savedAt, setSavedAt] = useState(null)

  useEffect(() => {
    fetch('/api/config/subreddits').then((r) => r.json()).then(setSubs)
    fetch('/api/config/system').then((r) => r.json()).then(setSys)
    fetch('/api/config/ai-provider').then((r) => r.json()).then(setAI)
  }, [])

  async function saveAll() {
    await Promise.all([
      fetch('/api/config/subreddits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subs),
      }),
      fetch('/api/config/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sys),
      }),
      fetch('/api/config/ai-provider', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ai),
      }),
    ])
    setSavedAt(new Date().toLocaleTimeString())
  }

  function updateSub(i, patch) {
    const list = [...subs.list]
    list[i] = { ...list[i], ...patch }
    setSubs({ ...subs, list })
  }

  function addSub() {
    setSubs({ ...subs, list: [...subs.list, { name: '', weight: 1, filters: { min_score: 0 } }] })
  }

  function removeSub(i) {
    const list = subs.list.filter((_, idx) => idx !== i)
    setSubs({ ...subs, list })
  }

  if (!sys || !ai) return <div className="text-mist/50">Loading…</div>

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Settings</h2>
        <div className="flex items-center gap-3">
          {savedAt && <span className="text-xs text-emerald-400">saved {savedAt}</span>}
          <button onClick={saveAll} className="bg-accent text-white px-4 py-2 rounded text-sm">
            Save all
          </button>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="font-semibold">Subreddits</h3>
        {subs.list.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-mist/60">r/</span>
            <input
              value={s.name}
              onChange={(e) => updateSub(i, { name: e.target.value })}
              className="bg-slate/70 rounded px-2 py-1 flex-1 text-sm"
            />
            <label className="text-xs text-mist/60">weight</label>
            <input
              type="number"
              step="0.1"
              value={s.weight ?? 1}
              onChange={(e) => updateSub(i, { weight: Number(e.target.value) })}
              className="bg-slate/70 rounded px-2 py-1 w-20 text-sm"
            />
            <label className="text-xs text-mist/60">min score</label>
            <input
              type="number"
              value={s.filters?.min_score ?? 0}
              onChange={(e) => updateSub(i, { filters: { ...s.filters, min_score: Number(e.target.value) } })}
              className="bg-slate/70 rounded px-2 py-1 w-20 text-sm"
            />
            <button onClick={() => removeSub(i)} className="text-mist/50 hover:text-red-300 px-2">
              ✕
            </button>
          </div>
        ))}
        <button onClick={addSub} className="text-sm text-accent">
          + Add subreddit
        </button>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">AI provider (for Reddit analysis only)</h3>
        <div className="flex items-center gap-3">
          <select
            value={ai.provider}
            onChange={(e) => setAI({ ...ai, provider: e.target.value })}
            className="bg-slate/70 rounded px-2 py-1 text-sm"
          >
            <option value="gemini">Gemini</option>
            <option value="openai">OpenAI</option>
          </select>
          <input
            value={ai.model}
            onChange={(e) => setAI({ ...ai, model: e.target.value })}
            placeholder="model"
            className="bg-slate/70 rounded px-2 py-1 text-sm flex-1"
          />
          <label className="text-xs text-mist/60">temp</label>
          <input
            type="number"
            step="0.1"
            value={ai.temperature}
            onChange={(e) => setAI({ ...ai, temperature: Number(e.target.value) })}
            className="bg-slate/70 rounded px-2 py-1 w-20 text-sm"
          />
        </div>
        <p className="text-xs text-mist/50">
          Cycle and carousel content generation are handled by Claude inside skills — not this API.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Output dimensions</h3>
        <div className="flex items-center gap-3">
          <label className="text-xs text-mist/60">width</label>
          <input
            type="number"
            value={sys.output.width}
            onChange={(e) => setSys({ ...sys, output: { ...sys.output, width: Number(e.target.value) } })}
            className="bg-slate/70 rounded px-2 py-1 w-24 text-sm"
          />
          <label className="text-xs text-mist/60">height</label>
          <input
            type="number"
            value={sys.output.height}
            onChange={(e) => setSys({ ...sys, output: { ...sys.output, height: Number(e.target.value) } })}
            className="bg-slate/70 rounded px-2 py-1 w-24 text-sm"
          />
          <label className="text-xs text-mist/60">default slides</label>
          <input
            type="number"
            value={sys.default_slide_count}
            onChange={(e) => setSys({ ...sys, default_slide_count: Number(e.target.value) })}
            className="bg-slate/70 rounded px-2 py-1 w-20 text-sm"
          />
        </div>
      </section>
    </div>
  )
}
