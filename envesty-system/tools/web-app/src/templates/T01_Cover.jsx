export default function T01_Cover({ slot, slide }) {
  return (
    <div className="export-stage flex flex-col justify-between p-16 bg-[#0c0e12] text-white">
      <div className="text-sm uppercase tracking-widest text-[#3d7bff]">
        {slot.meta?.pillar || 'Envesty'}
      </div>
      <div>
        <h1 className="text-7xl font-bold leading-[1.05] tracking-tight">{slide.headline}</h1>
        {slide.subhead && (
          <p className="mt-8 text-3xl text-white/70 leading-snug max-w-[80%]">{slide.subhead}</p>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/40">{slot.meta?.audience}</div>
        <div className="text-sm font-semibold tracking-wide">Envesty</div>
      </div>
    </div>
  )
}
