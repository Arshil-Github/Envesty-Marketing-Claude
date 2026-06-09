import { useEffect, useState } from 'react'

export default function RedditTab() {
  const [subs, setSubs] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [targetCount, setTargetCount] = useState(50)

  useEffect(() => {
    fetch('/api/config/subreddits')
      .then((r) => r.json())
      .then((data) => setSubs(data.list || []))
    fetch('/api/reddit/posts')
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
  }, [])

  async function runFetch() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/reddit/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_count: targetCount, score: true }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'fetch failed')
      setPosts(data.posts || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Reddit research</h2>
          <p className="text-sm text-mist/60">
            Pulling from {subs.length} configured subreddits:{' '}
            {subs.map((s) => `r/${s.name}`).join(', ') || '(none — set them in Settings)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-mist/60">target count</label>
          <input
            type="number"
            value={targetCount}
            onChange={(e) => setTargetCount(Number(e.target.value))}
            className="bg-slate/70 rounded px-2 py-1 w-20 text-sm"
          />
          <button
            onClick={runFetch}
            disabled={loading || subs.length === 0}
            className="bg-accent text-white px-4 py-2 rounded disabled:opacity-50 text-sm"
          >
            {loading ? 'Fetching…' : 'Fetch + analyze'}
          </button>
        </div>
      </div>
      {error && <div className="bg-red-900/50 text-red-200 p-3 rounded text-sm">{error}</div>}
      <div className="space-y-2">
        {posts.length === 0 && (
          <div className="text-mist/50 text-sm p-6 border border-slate/40 rounded">
            No posts yet. Click Fetch to pull from your configured subreddits.
          </div>
        )}
        {posts.map((p) => (
          <div key={p.id} className="border border-slate/40 rounded p-3 bg-slate/30">
            <div className="flex justify-between gap-4">
              <a href={p.url} target="_blank" rel="noreferrer" className="font-medium hover:text-accent">
                {p.title}
              </a>
              <div className="text-xs text-mist/50 shrink-0">
                r/{p.subreddit} · ▲ {p.score} · 💬 {p.num_comments}
                {p.relevance_score != null && (
                  <span className="ml-2 px-1.5 py-0.5 bg-accent/20 text-accent rounded">
                    relevance {p.relevance_score}/10
                  </span>
                )}
              </div>
            </div>
            {p.problem_summary && (
              <div className="text-sm text-mist/80 mt-1">{p.problem_summary}</div>
            )}
            {p.tags?.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {p.tags.map((t) => (
                  <span key={t} className="text-xs px-1.5 py-0.5 bg-slate/70 rounded">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
