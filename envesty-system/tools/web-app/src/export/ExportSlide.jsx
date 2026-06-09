import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { templateRegistry } from '../templates/registry.js'

export default function ExportSlide() {
  const { cycle, slot, slide } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`/api/cycles/${cycle}/${slot}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.slot) {
          setError('slot not found')
          return
        }
        setData(d.slot)
      })
      .catch((e) => setError(e.message))
  }, [cycle, slot])

  if (error) return <div className="p-8 text-red-700">Error: {error}</div>
  if (!data) return null

  const slideIndex = parseInt(slide, 10) - 1
  const slideData = data.slides?.[slideIndex]
  if (!slideData) return <div className="p-8 text-red-700">Slide {slide} not in slot.</div>

  const templateName = slideData.template || data.meta?.template || 'T01_Cover'
  const Template = templateRegistry[templateName]
  if (!Template) {
    return (
      <div className="p-8 text-red-700">
        Template "{templateName}" not found. Available: {Object.keys(templateRegistry).join(', ')}
      </div>
    )
  }

  return <Template slot={data} slide={slideData} />
}
