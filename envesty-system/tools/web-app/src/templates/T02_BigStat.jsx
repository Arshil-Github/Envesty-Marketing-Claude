export default function T02_BigStat({ slot, slide }) {
  return (
    <div className="export-stage flex flex-col justify-center items-center p-16 bg-white text-[#0c0e12]">
      <div className="text-[14rem] font-black leading-none text-[#3d7bff] tracking-tight">
        {slide.stat || slide.headline}
      </div>
      {slide.subhead && (
        <p className="mt-6 text-3xl text-center max-w-[80%] font-medium">{slide.subhead}</p>
      )}
      {slide.body && <p className="mt-4 text-xl text-gray-500 text-center max-w-[70%]">{slide.body}</p>}
      <div className="absolute bottom-12 right-12 text-sm font-semibold">Envesty</div>
    </div>
  )
}
