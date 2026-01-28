import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X, Maximize2, Minimize2 } from 'lucide-react'
import { getPresentData, markPresented } from '../services/api'

function PresentMode() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    loadPresentation()
  }, [id])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        nextSlide()
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault()
        prevSlide()
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          navigate('/')
        }
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentSlide, data])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const loadPresentation = async () => {
    setLoading(true)
    try {
      const presentData = await getPresentData(id)
      setData(presentData)
    } catch (err) {
      console.error('Error loading presentation:', err)
      setError('Failed to load presentation: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = useCallback(() => {
    if (data && currentSlide < data.slides.length - 1) {
      setCurrentSlide(prev => prev + 1)
    }
  }, [currentSlide, data])

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1)
    }
  }, [currentSlide])

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  const handleExit = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    }
    navigate('/')
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center'
      }}>
        <div style={{ color: 'white', fontSize: '24px' }}>Loading presentation {id}...</div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white'
      }}>
        <p style={{ fontSize: '24px', marginBottom: '20px' }}>{error}</p>
        <button onClick={() => navigate('/')} style={{ padding: '10px 20px', fontSize: '16px' }}>Go Back</button>
      </div>
    )
  }

  // No data state
  if (!data || !data.slides || data.slides.length === 0) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white'
      }}>
        <p style={{ fontSize: '24px', marginBottom: '20px' }}>No slides found. Build slides first.</p>
        <button onClick={() => navigate(`/${id}/edit`)} style={{ padding: '10px 20px', fontSize: '16px' }}>Edit Presentation</button>
      </div>
    )
  }

  const slide = data.slides[currentSlide]
  const brand = data.brand || {}
  const facility = data.facility || {}
  const primaryColor = brand.primary_color || '#0b7280'

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#000', display: 'flex', flexDirection: 'column'
      }}
      onClick={nextSlide}
    >
      {/* Slide Container */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px'
      }}>
        <div style={{
          width: '100%', maxWidth: '1600px', aspectRatio: '16/9',
          background: 'white', borderRadius: '12px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          {/* Render slide based on type */}
          {slide.slide_type === 'WelcomeIntro' && (
            <div style={{
              flex: 1, background: primaryColor, color: 'white',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '60px'
            }}>
              <h1 style={{ fontSize: '4rem', fontWeight: 700, marginBottom: '20px' }}>Welcome to {brand.name}</h1>
              <h2 style={{ fontSize: '2rem', fontWeight: 400, opacity: 0.9 }}>{facility.name}</h2>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 400, opacity: 0.8, marginTop: '20px' }}>Culture Night</h3>
            </div>
          )}

          {slide.slide_type === 'RaffleBumper' && (
            <div style={{
              flex: 1, background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center'
            }}>
              <h1 style={{ fontSize: '5rem', fontWeight: 800, color: primaryColor }}>RAFFLE TIME!</h1>
              <p style={{ fontSize: '1.5rem', color: primaryColor, marginTop: '20px' }}>Time to draw a winner!</p>
            </div>
          )}

          {slide.slide_type === 'HistoryBlock' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: primaryColor, color: 'white', padding: '30px 50px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>{slide.payload?.title || 'Our History'}</h1>
              </div>
              <div style={{ flex: 1, padding: '50px', overflow: 'auto' }}>
                {slide.payload?.content?.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ minWidth: '80px', fontWeight: 700, fontSize: '1.5rem', color: primaryColor }}>{item.year}</div>
                    <div style={{ fontSize: '1.25rem', color: '#374151' }}>{item.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide.slide_type === 'FootprintBlock' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: primaryColor, color: 'white', padding: '30px 50px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>{slide.payload?.title || 'Our Growing Footprint'}</h1>
              </div>
              <div style={{ flex: 1, padding: '50px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px' }}>
                {slide.payload?.content?.stats?.map((stat, idx) => (
                  <div key={idx} style={{ textAlign: 'center', padding: '30px', background: '#f3f4f6', borderRadius: '12px' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 700, color: primaryColor }}>{stat.value}</div>
                    <div style={{ fontSize: '1.25rem', color: '#6b7280', marginTop: '8px' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide.slide_type === 'RegionsBlock' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: primaryColor, color: 'white', padding: '30px 50px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>{slide.payload?.title || 'Our Regions'}</h1>
              </div>
              <div style={{ flex: 1, padding: '50px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {slide.payload?.content?.regions?.map((region, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#f3f4f6', borderRadius: '8px' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>{region.name}</span>
                    <span style={{ fontSize: '1.5rem', color: primaryColor, fontWeight: 700 }}>{region.facilities} facilities</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide.slide_type === 'CultureBlock' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: primaryColor, color: 'white', padding: '30px 50px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>{slide.payload?.title || `The ${brand.name} Way`}</h1>
              </div>
              <div style={{ flex: 1, padding: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h2 style={{ fontSize: '2rem', color: primaryColor, marginBottom: '40px' }}>{slide.payload?.content?.subtitle || 'We are NOT corporate'}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', maxWidth: '900px', width: '100%' }}>
                  <div style={{ textAlign: 'center', fontWeight: 700, color: primaryColor, fontSize: '1.25rem', paddingBottom: '10px', borderBottom: `3px solid ${primaryColor}` }}>{brand.name} Way</div>
                  <div style={{ textAlign: 'center', fontWeight: 700, color: '#9ca3af', fontSize: '1.25rem', paddingBottom: '10px', borderBottom: '3px solid #e5e7eb' }}>Common Way</div>
                  {slide.payload?.content?.comparisons?.map((comp, idx) => {
                    const keys = Object.keys(comp)
                    return (
                      <React.Fragment key={idx}>
                        <div style={{ padding: '16px', background: '#f0fdfa', borderRadius: '8px', fontSize: '1.1rem' }}>{comp[keys[0]]}</div>
                        <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px', fontSize: '1.1rem', color: '#6b7280' }}>{comp[keys[1]]}</div>
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {slide.slide_type === 'GameSlide' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: primaryColor, color: 'white', padding: '30px 50px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>{slide.payload?.title || 'Game Time!'}</h1>
              </div>
              <div style={{ flex: 1, padding: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {slide.payload?.value_label && <h2 style={{ fontSize: '2rem', color: primaryColor, textAlign: 'center', marginBottom: '30px' }}>{slide.payload.value_label}</h2>}
                {slide.payload?.rules && <div style={{ fontSize: '1.25rem', lineHeight: 1.8, color: '#374151', whiteSpace: 'pre-line' }}>{slide.payload.rules}</div>}
              </div>
            </div>
          )}

          {slide.slide_type === 'PillarsClosing' && (
            <div style={{ flex: 1, background: primaryColor, padding: '60px' }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 700, color: 'white', textAlign: 'center', marginBottom: '50px' }}>Our 3 Pillars</h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
                {(slide.payload?.pillars || [
                  { name: 'Clinical', description: 'Excellence in care' },
                  { name: 'Cultural', description: 'Our people, our values' },
                  { name: 'Financial', description: 'Sustainable success' }
                ]).map((pillar, idx) => (
                  <div key={idx} style={{ background: 'white', borderRadius: '12px', padding: '40px 30px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: primaryColor, marginBottom: '15px' }}>{pillar.name}</h3>
                    <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>{pillar.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Default fallback for unknown slide types */}
          {!['WelcomeIntro', 'RaffleBumper', 'HistoryBlock', 'FootprintBlock', 'RegionsBlock', 'CultureBlock', 'GameSlide', 'PillarsClosing'].includes(slide.slide_type) && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: primaryColor, color: 'white', padding: '30px 50px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>{slide.slide_type}</h1>
              </div>
              <div style={{ flex: 1, padding: '50px' }}>
                <pre style={{ fontSize: '14px', color: '#6b7280' }}>{JSON.stringify(slide.payload, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 20px',
          background: 'rgba(0, 0, 0, 0.8)', borderRadius: '12px', zIndex: 10000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', opacity: currentSlide === 0 ? 0.3 : 1 }}
        >
          <ChevronLeft size={24} />
        </button>

        <span style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>
          {currentSlide + 1} / {data.slides.length}
        </span>

        <button
          onClick={nextSlide}
          disabled={currentSlide === data.slides.length - 1}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', opacity: currentSlide === data.slides.length - 1 ? 0.3 : 1 }}
        >
          <ChevronRight size={24} />
        </button>

        <button onClick={toggleFullscreen} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '8px' }}>
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>

        <button onClick={handleExit} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '8px' }}>
          <X size={20} />
        </button>
      </div>
    </div>
  )
}

export default PresentMode
