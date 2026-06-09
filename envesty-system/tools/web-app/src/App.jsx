import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import RedditTab from './pages/RedditTab.jsx'
import CreatorTab from './pages/CreatorTab.jsx'
import TemplateEditorTab from './pages/TemplateEditorTab.jsx'
import AssetsTab from './pages/AssetsTab.jsx'
import InsightsTab from './pages/InsightsTab.jsx'
import SettingsTab from './pages/SettingsTab.jsx'
import ExportSlide from './export/ExportSlide.jsx'

const TABS = [
  { to: '/reddit', label: 'Reddit' },
  { to: '/creator', label: 'Creator' },
  { to: '/templates', label: 'Templates' },
  { to: '/assets', label: 'Assets' },
  { to: '/insights', label: 'Insights' },
  { to: '/settings', label: 'Settings' },
]

export default function App() {
  return (
    <Routes>
      <Route path="/export/:cycle/:slot/:slide" element={<ExportSlide />} />
      <Route path="/*" element={<Shell />} />
    </Routes>
  )
}

function Shell() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate/40 px-6 py-3 flex items-center gap-6 bg-ink">
        <div className="font-semibold tracking-wide text-mist">Envesty</div>
        <nav className="flex gap-1">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm ${
                  isActive ? 'bg-accent text-white' : 'text-mist/70 hover:bg-slate/60'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 p-6">
        <Routes>
          <Route index element={<Navigate to="/reddit" replace />} />
          <Route path="/reddit" element={<RedditTab />} />
          <Route path="/creator" element={<CreatorTab />} />
          <Route path="/templates" element={<TemplateEditorTab />} />
          <Route path="/assets" element={<AssetsTab />} />
          <Route path="/insights" element={<InsightsTab />} />
          <Route path="/settings" element={<SettingsTab />} />
        </Routes>
      </main>
    </div>
  )
}
