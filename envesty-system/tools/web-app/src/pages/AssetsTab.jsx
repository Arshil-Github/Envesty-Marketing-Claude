import { useEffect, useRef, useState } from 'react'

export default function AssetsTab() {
  const [inbox, setInbox] = useState([])
  const [index, setIndex] = useState({ entries: [] })
  const fileRef = useRef()

  useEffect(() => refresh(), [])

  function refresh() {
    fetch('/api/assets')
      .then((r) => r.json())
      .then((d) => {
        setInbox(d.inbox || [])
        setIndex(d.index || { entries: [] })
      })
  }

  async function upload(e) {
    const files = e.target.files
    if (!files?.length) return
    const form = new FormData()
    for (const f of files) form.append('files', f)
    await fetch('/api/assets/upload', { method: 'POST', body: form })
    fileRef.current.value = ''
    refresh()
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-semibold">Asset library</h2>
        <p className="text-sm text-mist/60">
          Drop files here, then run the <code>envesty-asset-library</code> skill to auto-tag them.
        </p>
      </div>

      <div className="border border-dashed border-slate/60 rounded p-6">
        <input ref={fileRef} type="file" multiple onChange={upload} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold mb-2">Inbox ({inbox.length})</h3>
          <div className="space-y-1">
            {inbox.map((f) => (
              <div key={f} className="text-sm p-2 bg-slate/40 rounded">
                {f}
              </div>
            ))}
            {inbox.length === 0 && <div className="text-sm text-mist/50">empty</div>}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-2">Analyzed ({index.entries.length})</h3>
          <div className="space-y-1">
            {index.entries.map((e) => (
              <div key={e.filename} className="text-sm p-2 bg-slate/40 rounded">
                <div className="font-medium">{e.filename}</div>
                {e.description && <div className="text-xs text-mist/70 mt-0.5">{e.description}</div>}
                {e.tags?.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {e.tags.map((t) => (
                      <span key={t} className="text-xs px-1.5 py-0.5 bg-slate/70 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {index.entries.length === 0 && <div className="text-sm text-mist/50">empty</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
