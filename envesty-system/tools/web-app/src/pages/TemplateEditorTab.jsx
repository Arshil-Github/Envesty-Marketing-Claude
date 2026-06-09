import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'

export default function TemplateEditorTab() {
  const [templates, setTemplates] = useState([])
  const [activeName, setActiveName] = useState(null)
  const [source, setSource] = useState('')
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [previewRef, setPreviewRef] = useState({ cycle: '', slot: '', slide: '01' })

  useEffect(() => refresh(), [])

  function refresh() {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates || []))
  }

  useEffect(() => {
    if (!activeName) return
    fetch(`/api/templates/${activeName}`)
      .then((r) => r.json())
      .then((d) => setSource(d.source || ''))
  }, [activeName])

  async function save() {
    if (!activeName) return
    setSaving(true)
    await fetch(`/api/templates/${activeName}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source }),
    })
    setSaving(false)
    refresh()
  }

  async function createNew() {
    const name = newName.trim()
    if (!name) return
    const starter = `export default function ${name}({ slot, slide }) {
  return (
    <div className="export-stage flex flex-col items-center justify-center p-12 bg-white text-black">
      <h1 className="text-5xl font-bold">{slide.headline}</h1>
      {slide.subhead && <p className="mt-4 text-xl text-gray-600">{slide.subhead}</p>}
    </div>
  )
}
`
    await fetch(`/api/templates/${name}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: starter }),
    })
    setNewName('')
    refresh()
    setActiveName(name)
  }

  return (
    <div className="grid grid-cols-[200px_1fr_420px] gap-4 max-w-[1600px] h-[calc(100vh-120px)]">
      <aside className="space-y-3">
        <h3 className="text-sm font-semibold text-mist/70 uppercase tracking-wide">Templates</h3>
        {templates.map((t) => (
          <button
            key={t.name}
            onClick={() => setActiveName(t.name)}
            className={`block text-sm w-full text-left px-2 py-1 rounded ${
              activeName === t.name ? 'bg-accent/30' : 'hover:bg-slate/40'
            }`}
          >
            {t.name}
          </button>
        ))}
        <div className="pt-3 border-t border-slate/40 space-y-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="T06_NewName"
            className="bg-slate/70 rounded px-2 py-1 w-full text-sm"
          />
          <button onClick={createNew} className="w-full bg-slate/70 px-2 py-1 rounded text-sm">
            + New template
          </button>
        </div>
      </aside>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-mist/70">{activeName || '(no template selected)'}</div>
          <button
            onClick={save}
            disabled={!activeName || saving}
            className="bg-accent text-white px-3 py-1 rounded text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        <div className="flex-1 border border-slate/40 rounded overflow-hidden">
          {activeName ? (
            <Editor
              defaultLanguage="javascript"
              theme="vs-dark"
              value={source}
              onChange={(v) => setSource(v || '')}
              options={{ minimap: { enabled: false }, fontSize: 13 }}
            />
          ) : (
            <div className="p-6 text-sm text-mist/50">
              Pick a template on the left, or scaffold a new one below.
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="text-sm text-mist/70">Live preview</div>
        <div className="flex gap-1 text-xs">
          <input
            placeholder="cycle (e.g. 2026-06_cycle-01)"
            value={previewRef.cycle}
            onChange={(e) => setPreviewRef({ ...previewRef, cycle: e.target.value })}
            className="bg-slate/70 rounded px-2 py-1 flex-1"
          />
          <input
            placeholder="slot"
            value={previewRef.slot}
            onChange={(e) => setPreviewRef({ ...previewRef, slot: e.target.value })}
            className="bg-slate/70 rounded px-2 py-1 w-24"
          />
          <input
            placeholder="01"
            value={previewRef.slide}
            onChange={(e) => setPreviewRef({ ...previewRef, slide: e.target.value })}
            className="bg-slate/70 rounded px-2 py-1 w-12"
          />
        </div>
        <div className="border border-slate/40 rounded bg-white flex-1 overflow-hidden">
          {previewRef.cycle && previewRef.slot ? (
            <iframe
              title="preview"
              src={`/export/${previewRef.cycle}/${previewRef.slot}/${previewRef.slide}`}
              className="w-full h-full"
              style={{ transform: 'scale(0.4)', transformOrigin: 'top left', width: '250%', height: '250%' }}
            />
          ) : (
            <div className="p-4 text-sm text-gray-500">Enter cycle + slot to preview.</div>
          )}
        </div>
      </section>
    </div>
  )
}
