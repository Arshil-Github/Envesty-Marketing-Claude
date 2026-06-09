import { useEffect, useState } from 'react'

export default function InsightsTab() {
  const [memory, setMemory] = useState({ entries: [] })
  const [digests, setDigests] = useState([])
  const [activeDigest, setActiveDigest] = useState(null)
  const [digestContent, setDigestContent] = useState('')

  useEffect(() => {
    fetch('/api/insights/memory')
      .then((r) => r.json())
      .then(setMemory)
    fetch('/api/insights/digests')
      .then((r) => r.json())
      .then((d) => setDigests(d.files || []))
  }, [])

  useEffect(() => {
    if (!activeDigest) return
    fetch(`/api/insights/digests/${activeDigest}`)
      .then((r) => r.json())
      .then((d) => setDigestContent(d.content || ''))
  }, [activeDigest])

  return (
    <div className="grid grid-cols-[260px_1fr] gap-6 max-w-6xl">
      <aside>
        <h3 className="text-sm font-semibold mb-2">Digests</h3>
        {digests.length === 0 && <div className="text-sm text-mist/50">none yet</div>}
        {digests.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDigest(d)}
            className={`block text-sm w-full text-left px-2 py-1 rounded ${
              activeDigest === d ? 'bg-accent/30' : 'hover:bg-slate/40'
            }`}
          >
            {d}
          </button>
        ))}
      </aside>
      <section className="space-y-6">
        {activeDigest && (
          <div>
            <h3 className="text-sm font-semibold mb-2">{activeDigest}</h3>
            <pre className="whitespace-pre-wrap text-sm bg-slate/30 p-4 rounded">{digestContent}</pre>
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold mb-2">What worked ({memory.entries.length} entries)</h3>
          <div className="space-y-2">
            {memory.entries.map((e, i) => (
              <div key={i} className="bg-slate/40 p-3 rounded text-sm">
                <div className="font-medium">{e.slot_ref}</div>
                <div className="text-xs text-mist/60">{e.posted_at}</div>
                {e.metrics && (
                  <div className="text-xs mt-1">
                    impressions {e.metrics.impressions} · engagement {e.metrics.engagement} · saves{' '}
                    {e.metrics.saves} · clicks {e.metrics.clicks}
                  </div>
                )}
                {e.patterns_observed && <div className="text-xs mt-1 text-mist/80">{e.patterns_observed}</div>}
              </div>
            ))}
            {memory.entries.length === 0 && <div className="text-sm text-mist/50">no entries yet</div>}
          </div>
        </div>
      </section>
    </div>
  )
}
