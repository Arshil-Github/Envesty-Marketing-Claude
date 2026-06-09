export default function T05_CTA({ slot, slide }) {
  return (
    <div className="export-stage flex flex-col justify-between p-16 bg-[#3d7bff] text-white">
      <div className="text-sm uppercase tracking-widest opacity-70">
        {slot.meta?.pillar || 'Next step'}
      </div>
      <div>
        <h1 className="text-6xl font-bold leading-tight">{slide.headline}</h1>
        {slide.body && <p className="mt-6 text-2xl opacity-90 leading-snug">{slide.body}</p>}
      </div>
      <div className="flex items-center justify-between">
        <div className="bg-white text-[#3d7bff] px-8 py-4 rounded-full font-semibold text-2xl">
          {slot.cta || 'Follow Envesty'}
        </div>
        <div className="text-sm font-semibold">Envesty</div>
      </div>
    </div>
  )
}
