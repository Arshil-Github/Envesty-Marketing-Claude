export default function T04_Quote({ slot, slide }) {
  return (
    <div className="export-stage flex flex-col justify-center p-20 bg-[#0c0e12] text-white">
      <div className="text-[#3d7bff] text-9xl leading-none">"</div>
      <p className="text-5xl leading-tight font-medium mt-4">{slide.headline}</p>
      {slide.attribution && (
        <div className="mt-10 text-xl text-white/60">— {slide.attribution}</div>
      )}
      <div className="text-sm text-white/40 mt-16">Envesty</div>
    </div>
  )
}
