export default function T03_Comparison({ slot, slide }) {
  const left = slide.left || { label: 'Before', body: slide.before || '' }
  const right = slide.right || { label: 'After', body: slide.after || '' }
  return (
    <div className="export-stage flex flex-col p-16 bg-[#f4f6fa] text-[#0c0e12]">
      <h2 className="text-5xl font-bold mb-12">{slide.headline}</h2>
      <div className="grid grid-cols-2 gap-8 flex-1">
        <div className="bg-white rounded-3xl p-10 shadow-lg flex flex-col">
          <div className="text-sm uppercase tracking-widest text-gray-500 mb-4">{left.label}</div>
          <div className="text-3xl leading-snug">{left.body}</div>
        </div>
        <div className="bg-[#0c0e12] text-white rounded-3xl p-10 shadow-lg flex flex-col">
          <div className="text-sm uppercase tracking-widest text-[#3d7bff] mb-4">{right.label}</div>
          <div className="text-3xl leading-snug">{right.body}</div>
        </div>
      </div>
      <div className="text-sm text-gray-500 mt-10 self-end">Envesty</div>
    </div>
  )
}
