import React, { useCallback, useEffect, useState, Children } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CarouselProps {
  children: React.ReactNode
  slidesToShow?: {
    mobile: number
    tablet: number
    desktop: number
  }
  showDots?: boolean
  showArrows?: boolean
  autoplay?: boolean
  rtl?: boolean
  gap?: number
}

const Carousel: React.FC<CarouselProps> = ({
  children,
  slidesToShow = { mobile: 3, tablet: 5, desktop: 6 },
  showDots = true,
  showArrows = true,
  autoplay = false,
  rtl = true,
  gap = 8
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    direction: rtl ? 'rtl' : 'ltr',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    dragFree: false,
    skipSnaps: false,
    align: 'start'
  })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index)
  }, [emblaApi])

  const onInit = useCallback((emblaApi: any) => {
    setScrollSnaps(emblaApi.scrollSnapList())
  }, [])

  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    onInit(emblaApi)
    onSelect(emblaApi)
    emblaApi.on('reInit', onInit)
    emblaApi.on('select', onSelect)
  }, [emblaApi, onInit, onSelect])

  // Autoplay functionality
  useEffect(() => {
    if (!emblaApi || !autoplay || isHovered) return

    const autoplayInterval = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext()
      } else {
        emblaApi.scrollTo(0)
      }
    }, 4000)

    return () => clearInterval(autoplayInterval)
  }, [emblaApi, autoplay, isHovered])

  // Track window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate slide width based on screen size
  const getSlideWidth = () => {
    if (windowWidth < 768) return `${100 / slidesToShow.mobile}%`
    if (windowWidth < 1024) return `${100 / slidesToShow.tablet}%`
    return `${100 / slidesToShow.desktop}%`
  }

  const currentSlidesToShow = windowWidth < 768 ? slidesToShow.mobile : windowWidth < 1024 ? slidesToShow.tablet : slidesToShow.desktop
  const childrenCount = Children.count(children)
  const shouldCenter = childrenCount < currentSlidesToShow

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Navigation Arrows */}
      {showArrows && (
        <>
          <button
            className={`absolute right-1 md:-right-12 top-1/2 -translate-y-1/2 z-10 p-1.5 md:p-2 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg border border-gray-100 transition-all duration-300 flex items-center justify-center ${(rtl ? !canScrollPrev : !canScrollNext) ? 'opacity-0 pointer-events-none' : 'hover:scale-110 active:scale-95'
              }`}
            onClick={rtl ? scrollPrev : scrollNext}
            disabled={rtl ? !canScrollPrev : !canScrollNext}
            aria-label={rtl ? "الشريحة السابقة" : "الشريحة التالية"}
          >
            <ChevronRight className="w-5 h-5 md:w-7 md:h-7" />
          </button>
          <button
            className={`absolute left-1 md:-left-12 top-1/2 -translate-y-1/2 z-10 p-1.5 md:p-2 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg border border-gray-100 transition-all duration-300 flex items-center justify-center ${(rtl ? !canScrollNext : !canScrollPrev) ? 'opacity-0 pointer-events-none' : 'hover:scale-110 active:scale-95'
              }`}
            onClick={rtl ? scrollNext : scrollPrev}
            disabled={rtl ? !canScrollNext : !canScrollPrev}
            aria-label={rtl ? "الشريحة التالية" : "الشريحة السابقة"}
          >
            <ChevronLeft className="w-5 h-5 md:w-7 md:h-7" />
          </button>
        </>
      )}

      {/* Mobile Swipe Indicator */}
      {showDots && (
        <div className="md:hidden text-center mb-2 sm:mb-4">
          <div className="inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded-full">
            <span className="text-sm sm:text-base">👆</span>
            <span>اسحب لليمين أو اليسار</span>
          </div>
        </div>
      )}

      {/* Carousel Container */}
      <div className="w-full overflow-hidden cursor-grab active:cursor-grabbing embla" ref={emblaRef}>
        <div className={`flex embla__container w-full ${shouldCenter ? 'justify-center' : ''}`} style={{ marginLeft: `-${gap / 2}px`, marginRight: `-${gap / 2}px` }}>
          {Children.toArray(children).map((child, index) => (
            <div
              key={index}
              className="flex-shrink-0 touch-pan-y embla__slide w-full"
              style={{
                flex: `0 0 ${getSlideWidth()}`,
                minWidth: 0,
                paddingLeft: `${gap / 2}px`,
                paddingRight: `${gap / 2}px`
              }}
            >
              <div className="w-full h-full">
                {child}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Bar for Mobile */}
      {showDots && (
        <div className="md:hidden mt-2 sm:mt-4 mx-4 bg-gray-200 rounded-full h-1 overflow-hidden">
          <div
            className="bg-emerald-600 h-full transition-all duration-300 ease-out"
            style={{
              width: `${scrollSnaps.length > 0 ? ((selectedIndex + 1) / scrollSnaps.length) * 100 : 0}%`
            }}
          />
        </div>
      )}

      {/* Dots Navigation - Moved to relative below for better visibility */}
      {showDots && scrollSnaps.length > 1 && (
        <div className="flex justify-center mt-8 md:mt-12 gap-2 z-10">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-300 ${index === selectedIndex
                  ? 'bg-emerald-600 w-4 md:w-6'
                  : 'bg-gray-300 hover:bg-gray-400'
                }`}
              onClick={() => scrollTo(index)}
              aria-label={`الانتقال للشريحة ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter for Mobile - Updated position */}
      {showDots && (
        <div className="md:hidden text-center mt-2">
          <span className="text-[10px] text-gray-400">
            {selectedIndex + 1} / {scrollSnaps.length}
          </span>
        </div>
      )}
    </div>
  )
}

export default Carousel
