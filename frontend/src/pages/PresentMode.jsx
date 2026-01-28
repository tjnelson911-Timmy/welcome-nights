import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X, Maximize2, Minimize2 } from 'lucide-react'
import { getPresentData } from '../services/api'

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
        background: '#1a1a2e', display: 'flex', justifyContent: 'center', alignItems: 'center'
      }}>
        <div style={{ color: 'white', fontSize: '24px' }}>Loading presentation...</div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#1a1a2e', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white'
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
        background: '#1a1a2e', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white'
      }}>
        <p style={{ fontSize: '24px', marginBottom: '20px' }}>No slides found. Build slides first.</p>
        <button onClick={() => navigate(`/${id}/edit`)} style={{ padding: '10px 20px', fontSize: '16px' }}>Edit Presentation</button>
      </div>
    )
  }

  const slide = data.slides[currentSlide]
  const brand = data.brand || {}
  const facility = data.facility || {}
  const payload = slide.payload || {}
  const primaryColor = payload.primary_color || brand.primary_color || '#0b7280'

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#1a1a2e', display: 'flex', flexDirection: 'column'
      }}
      onClick={nextSlide}
    >
      {/* Slide Container */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px'
      }}>
        <div style={{
          width: '100%', maxWidth: '1400px', aspectRatio: '16/9',
          background: 'white', borderRadius: '8px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          {renderSlide(slide, brand, facility, primaryColor)}
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

function renderSlide(slide, brand, facility, primaryColor) {
  const { slide_type, payload = {} } = slide

  switch (slide_type) {
    case 'TitleSlide':
    case 'EndSlide':
      return <LogoSlide payload={payload} brand={brand} facility={facility} primaryColor={primaryColor} />

    case 'WelcomeSlide':
      return <WelcomeSlide payload={payload} primaryColor={primaryColor} />

    case 'IcebreakerGame':
      return <GameSlide payload={payload} primaryColor={primaryColor} isIcebreaker={true} />

    case 'HistoryIntro':
      return <ImageSlide type="history" brand={brand} primaryColor={primaryColor} />

    case 'HistoryTimeline':
      return <HistoryTimelineSlide payload={payload} brand={brand} primaryColor={primaryColor} />

    case 'FootprintStats':
      return <FootprintSlide payload={payload} primaryColor={primaryColor} />

    case 'RegionsMap':
      return <RegionsSlide payload={payload} primaryColor={primaryColor} />

    case 'CultureIntro':
      return <CultureIntroSlide payload={payload} brand={brand} primaryColor={primaryColor} />

    case 'CultureComparison':
      return <CultureComparisonSlide payload={payload} brand={brand} primaryColor={primaryColor} />

    case 'FieldIntro':
      return <FieldSlide payload={payload} primaryColor={primaryColor} />

    case 'RaffleBumper':
      return <RaffleSlide payload={payload} primaryColor={primaryColor} />

    case 'TransitionSlide':
      return <TransitionSlide primaryColor={primaryColor} />

    case 'ValueFamily':
    case 'ValueOwnership':
    case 'ValueResponsibility':
    case 'ValueCelebration':
    case 'ValueExperience':
      return <ValueSlide payload={payload} primaryColor={primaryColor} />

    case 'ChallengeGame':
      return <GameSlide payload={payload} primaryColor={primaryColor} isIcebreaker={false} />

    case 'ThreePillars':
      return <PillarsSlide payload={payload} primaryColor={primaryColor} />

    // Legacy slide types for backward compatibility
    case 'WelcomeIntro':
      return <LogoSlide payload={payload} brand={brand} facility={facility} primaryColor={primaryColor} />
    case 'HistoryBlock':
      return <HistoryTimelineSlide payload={payload} brand={brand} primaryColor={primaryColor} />
    case 'FootprintBlock':
      return <FootprintSlide payload={payload} primaryColor={primaryColor} />
    case 'RegionsBlock':
      return <RegionsSlide payload={payload} primaryColor={primaryColor} />
    case 'CultureBlock':
      return <CultureIntroSlide payload={payload} brand={brand} primaryColor={primaryColor} />
    case 'GameSlide':
      return <GameSlide payload={payload} primaryColor={primaryColor} isIcebreaker={false} />
    case 'PillarsClosing':
      return <PillarsSlide payload={payload} primaryColor={primaryColor} />

    default:
      return <DefaultSlide slideType={slide_type} payload={payload} primaryColor={primaryColor} />
  }
}

// Logo/Title Slide
function LogoSlide({ payload, brand, facility, primaryColor }) {
  const logoUrl = payload.logo_url || brand.logo_url
  return (
    <div style={{
      flex: 1, background: `linear-gradient(135deg, ${primaryColor} 0%, #1a1a2e 100%)`,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      padding: '60px'
    }}>
      {logoUrl && (
        <img src={logoUrl} alt="Logo" style={{ maxWidth: '400px', maxHeight: '300px', marginBottom: '40px' }} />
      )}
      <h1 style={{ fontSize: '3rem', fontWeight: 700, color: 'white', textAlign: 'center' }}>
        {facility.name || payload.facility_name}
      </h1>
    </div>
  )
}

// Welcome Slide
function WelcomeSlide({ payload, primaryColor }) {
  return (
    <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: primaryColor, padding: '40px 60px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, color: 'white', margin: 0 }}>
          {payload.title || 'Welcome to Culture Night!!!'}
        </h1>
      </div>
      <div style={{ flex: 1, padding: '50px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {(payload.bullets || []).map((bullet, idx) => (
          <div key={idx} style={{
            fontSize: '1.5rem', color: '#333', marginBottom: '20px',
            display: 'flex', alignItems: 'flex-start', gap: '15px'
          }}>
            <span style={{ color: primaryColor, fontWeight: 'bold' }}>•</span>
            <span>{bullet}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Game Slide (Icebreaker or Challenge)
function GameSlide({ payload, primaryColor, isIcebreaker }) {
  return (
    <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: isIcebreaker ? `linear-gradient(135deg, ${primaryColor} 0%, #2d3748 100%)` : primaryColor,
        padding: '30px 60px'
      }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: 'white', margin: 0 }}>
          {payload.title || payload.game_title || 'Game Time!'}
        </h1>
      </div>
      <div style={{
        flex: 1, padding: '50px 80px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
      }}>
        {payload.value && (
          <div style={{
            fontSize: '1.25rem', color: primaryColor, fontWeight: 600,
            marginBottom: '30px', textTransform: 'uppercase', letterSpacing: '2px'
          }}>
            {payload.value}
          </div>
        )}
        <div style={{
          fontSize: '1.4rem', color: '#444', lineHeight: 2, whiteSpace: 'pre-line', textAlign: 'center'
        }}>
          {payload.rules}
        </div>
      </div>
    </div>
  )
}

// History Timeline Slide
function HistoryTimelineSlide({ payload, brand, primaryColor }) {
  const events = payload.events || payload.content?.items || []
  return (
    <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: primaryColor, padding: '30px 60px' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: 'white', margin: 0 }}>
          {payload.title || `The ${brand.name} "Family"`}
        </h1>
      </div>
      <div style={{ flex: 1, padding: '50px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {events.map((event, idx) => (
          <div key={idx} style={{
            display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '25px'
          }}>
            <div style={{
              minWidth: '150px', fontSize: '1.25rem', fontWeight: 700, color: primaryColor
            }}>
              {event.date || event.year}
            </div>
            <div style={{ fontSize: '1.25rem', color: '#333' }}>
              {event.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Footprint Stats Slide
function FootprintSlide({ payload, primaryColor }) {
  const stats = payload.stats || payload.content?.stats || []
  return (
    <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: primaryColor, padding: '30px 60px' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: 'white', margin: 0 }}>
          {payload.title || 'OUR GROWING FOOTPRINT'}
        </h1>
      </div>
      <div style={{
        flex: 1, padding: '50px', display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(stats.length, 3)}, 1fr)`, gap: '40px',
        alignItems: 'center', justifyContent: 'center'
      }}>
        {stats.map((stat, idx) => (
          <div key={idx} style={{
            textAlign: 'center', padding: '40px',
            background: '#f8f9fa', borderRadius: '16px'
          }}>
            <div style={{ fontSize: '4rem', fontWeight: 800, color: primaryColor }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '1.25rem', color: '#666', marginTop: '10px' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Regions Slide
function RegionsSlide({ payload, primaryColor }) {
  const regions = payload.regions || payload.content?.regions || []
  return (
    <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: primaryColor, padding: '30px 60px' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: 'white', margin: 0 }}>
          {payload.title || '5 Healthcare Company Regions'}
        </h1>
      </div>
      <div style={{ flex: 1, padding: '50px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {regions.map((region, idx) => (
          <div key={idx} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '20px 30px', marginBottom: '15px',
            background: '#f8f9fa', borderRadius: '12px', borderLeft: `4px solid ${primaryColor}`
          }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 600, color: '#333' }}>
              {region.label || region.name}
            </span>
            {region.facilities && (
              <span style={{ fontSize: '1.25rem', color: primaryColor, fontWeight: 700 }}>
                {region.facilities} facilities
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Culture Intro Slide
function CultureIntroSlide({ payload, brand, primaryColor }) {
  return (
    <div style={{
      flex: 1, background: `linear-gradient(135deg, ${primaryColor} 0%, #1a1a2e 100%)`,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      padding: '60px', textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'white', marginBottom: '30px' }}>
        {payload.title || 'WE ARE NOT CORPORATE!'}
      </h1>
      <h2 style={{ fontSize: '2rem', fontWeight: 400, color: 'rgba(255,255,255,0.9)' }}>
        {payload.subtitle || `The ${brand.name} Way…`}
      </h2>
    </div>
  )
}

// Culture Comparison Slide
function CultureComparisonSlide({ payload, brand, primaryColor }) {
  const comparisons = payload.comparisons || payload.content?.comparisons || []
  return (
    <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', borderBottom: '3px solid #eee' }}>
        <div style={{
          flex: 1, padding: '30px', textAlign: 'center',
          background: '#f5f5f5', borderRight: '2px solid #eee'
        }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#999', margin: 0 }}>
            {payload.left_title || 'The Common Way…'}
          </h2>
        </div>
        <div style={{
          flex: 1, padding: '30px', textAlign: 'center', background: `${primaryColor}15`
        }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: primaryColor, margin: 0 }}>
            {payload.right_title || `The ${brand.name} Way…`}
          </h2>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {comparisons.map((comp, idx) => (
          <div key={idx} style={{ display: 'flex', flex: 1, borderBottom: '1px solid #eee' }}>
            <div style={{
              flex: 1, padding: '25px 40px', display: 'flex', alignItems: 'center',
              background: '#fafafa', borderRight: '2px solid #eee',
              fontSize: '1.2rem', color: '#666'
            }}>
              {comp.common || comp[Object.keys(comp)[0]]}
            </div>
            <div style={{
              flex: 1, padding: '25px 40px', display: 'flex', alignItems: 'center',
              background: `${primaryColor}08`,
              fontSize: '1.2rem', color: '#333', fontWeight: 500
            }}>
              {comp.ours || comp[Object.keys(comp)[1]]}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Field Slide
function FieldSlide({ payload, primaryColor }) {
  return (
    <div style={{
      flex: 1, background: `linear-gradient(180deg, ${primaryColor} 0%, #2d3748 100%)`,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <h1 style={{ fontSize: '5rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '10px' }}>
        {payload.title || 'Field'}
      </h1>
    </div>
  )
}

// Raffle Slide
function RaffleSlide({ payload, primaryColor }) {
  return (
    <div style={{
      flex: 1, background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
    }}>
      <h1 style={{ fontSize: '6rem', fontWeight: 900, color: primaryColor, textShadow: '2px 2px 0 white' }}>
        {payload.title || 'RAFFLE'}
      </h1>
      <p style={{ fontSize: '1.75rem', color: primaryColor, marginTop: '20px' }}>
        {payload.subtitle || 'Time to draw a winner!'}
      </p>
    </div>
  )
}

// Transition Slide
function TransitionSlide({ primaryColor }) {
  return (
    <div style={{
      flex: 1, background: primaryColor, display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
    </div>
  )
}

// Value Slide (FAMILY, OWNERSHIP, etc.)
function ValueSlide({ payload, primaryColor }) {
  return (
    <div style={{
      flex: 1, background: `linear-gradient(135deg, ${primaryColor} 0%, #1a1a2e 100%)`,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <h1 style={{
        fontSize: '6rem', fontWeight: 900, color: 'white',
        textTransform: 'uppercase', letterSpacing: '15px'
      }}>
        {payload.value}
      </h1>
    </div>
  )
}

// Three Pillars Slide
function PillarsSlide({ payload, primaryColor }) {
  const pillars = payload.pillars || [
    { name: 'Clinical', description: 'Excellence in patient care' },
    { name: 'Cultural', description: 'Our people and values' },
    { name: 'Financial', description: 'Sustainable success' },
  ]
  return (
    <div style={{
      flex: 1, background: primaryColor, padding: '60px',
      display: 'flex', flexDirection: 'column'
    }}>
      <h1 style={{
        fontSize: '3rem', fontWeight: 700, color: 'white',
        textAlign: 'center', marginBottom: '50px'
      }}>
        {payload.title || '3 Pillars'}
      </h1>
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px'
      }}>
        {pillars.map((pillar, idx) => (
          <div key={idx} style={{
            background: 'white', borderRadius: '16px', padding: '50px 30px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 700, color: primaryColor, marginBottom: '15px' }}>
              {pillar.name}
            </h3>
            <p style={{ fontSize: '1.1rem', color: '#666', lineHeight: 1.5 }}>
              {pillar.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Image Slide (placeholder for history intro, etc.)
function ImageSlide({ type, brand, primaryColor }) {
  return (
    <div style={{
      flex: 1, background: `linear-gradient(135deg, ${primaryColor}22 0%, ${primaryColor}44 100%)`,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        fontSize: '1.5rem', color: primaryColor, fontStyle: 'italic', textAlign: 'center'
      }}>
        {type === 'history' ? `${brand.name} History Image` : 'Image Slide'}
      </div>
    </div>
  )
}

// Default Slide for unknown types
function DefaultSlide({ slideType, payload, primaryColor }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: primaryColor, padding: '30px 60px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'white', margin: 0 }}>
          {slideType}
        </h1>
      </div>
      <div style={{ flex: 1, padding: '40px', overflow: 'auto' }}>
        <pre style={{ fontSize: '14px', color: '#666', whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(payload, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default PresentMode
