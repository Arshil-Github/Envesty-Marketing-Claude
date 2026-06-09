import { useEffect, useState } from 'react'

export default function CreatorTab() {
  const [cycles, setCycles] = useState([])
  const [activeCycle, setActiveCycle] = useState(null)
  const [activeSlot, setActiveSlot] = useState(null)
  const [slotData, setSlotData] = useState(null)
  const [rendering, setRendering] = useState(false)
  const [renderResult, setRenderResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    refresh()
  }, [])

  function refresh() {
    fetch('/api/cycles')
      .then((r) => r.json())
      .then((d) => setCycles(d.cycles || []))
  }

  useEffect(() => {
    if (!activeCycle || !activeSlot) return
    fetch(`/api/cycles/${activeCycle}/${activeSlot}`)
      .then((r) => r.json())
      .then((d) => setSlotData(d.slot))
  }, [activeCycle, activeSlot])

  async function save() {
    const res = await fetch(`/api/cycles/${activeCycle}/${activeSlot}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slotData),
    })
    const d = await res.json()
    if (!d.ok) setError(d.error)
  }

  async function render() {
    setRendering(true)
    setError(null)
    setRenderResult(null)
    try {
      const res = await fetch('/api/generate/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycle: activeCycle, slot: activeSlot }),
      })
      const d = await res.json()
      if (!d.ok) throw new Error(d.error || 'render failed')
      setRenderResult(d)
    } catch (e) {
      setError(e.message)
    } finally {
      setRendering(false)
    }
  }

  return (
    <div className="grid grid-cols-[260px_1fr] gap-6 max-w-7xl">
      <aside className="space-y-3">
        <h3 className="text-sm font-semibold text-mist/70 uppercase tracking-wide">Cycles</h3>
        {cycles.length === 0 && (
          <p className="text-xs text-mist/50">
            No cycles yet. Generate one via the <code>envesty-generate-cycle</code> skill.
          </p>
        )}
        {cycles.map((c) => (
          <div key={c.name}>
            <button
              className={`text-sm w-full text-left px-2 py-1 rounded ${
                activeCycle === c.name ? 'bg-accent/30' : 'hover:bg-slate/40'
              }`}
              onClick={() => setActiveCycle(c.name)}
            >
              {c.name}
            </button>
            {activeCycle === c.name && (
              <div className="ml-3 mt-1 space-y-0.5">
                {c.slots.map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveSlot(s)}
                    className={`block text-xs w-full text-left px-2 py-1 rounded ${
                      activeSlot === s ? 'bg-accent/20' : 'hover:bg-slate/30'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </aside>

      <section>
        {!slotData && (
          <div className="text-mist/50 text-sm">Pick a cycle and slot from the sidebar.</div>
        )}
        {slotData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {activeCycle} / {activeSlot}
                </h2>
                <div className="text-sm text-mist/60">
                  Topic: {slotData.meta?.topic} · Audience: {slotData.meta?.audience}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={save} className="px-3 py-1.5 bg-slate/70 rounded text-sm">
                  Save
                </button>
                <button
                  onClick={render}
                  disabled={rendering}
                  className="px-3 py-1.5 bg-accent text-white rounded text-sm disabled:opacity-50"
                >
                  {rendering ? 'Rendering…' : 'Render carousel'}
                </button>
              </div>
            </div>
            {error && <div className="bg-red-900/50 text-red-200 p-3 rounded text-sm">{error}</div>}
            {renderResult && (
              <div className="bg-emerald-900/30 text-emerald-200 p-3 rounded text-sm">
                Rendered {renderResult.slides.length} slides to {renderResult.outDir}
              </div>
            )}
            <textarea
              className="w-full h-[420px] bg-slate/40 text-xs font-mono p-3 rounded"
              value={JSON.stringify(slotData, null, 2)}
              onChange={(e) => {
                try {
                  setSlotData(JSON.parse(e.target.value))
                } catch {
                  // ignore parse errors while typing
                }
              }}
            />
          </div>
        )}
      </section>
    </div>
  )
}
