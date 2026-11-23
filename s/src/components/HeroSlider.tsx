import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { nextSlideIndex } from '../utils/storeLogic';
import { ImageWithFallback } from './ImageWithFallback';

interface HeroSliderProps {
  onSelectSection: (section: string) => void;
}

export function HeroSlider({ onSelectSection }: HeroSliderProps) {
  const { sliders } = useStore();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (sliders.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => nextSlideIndex(prev, sliders.length, 1));
    }, 4500);
    return () => clearInterval(timer);
  }, [sliders.length]);

  useEffect(() => {
    if (activeIndex >= sliders.length && sliders.length > 0) {
      setActiveIndex(0);
    }
  }, [activeIndex, sliders.length]);

  if (sliders.length === 0) {
    return null;
  }

  const current = sliders[activeIndex] || sliders[0];

  return (
    <section
      aria-label="العروض الرئيسية"
      className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6"
    >
      {/* Wide landscape slider (wide & low-height, NOT tall) */}
      <div className="relative w-full h-[170px] sm:h-[230px] lg:h-[290px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
        {sliders.map((slide, idx) => (
          <div
            key={slide.id}
            aria-hidden={idx !== activeIndex}
            className={`absolute inset-0 transition-opacity duration-500 ${
              idx === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <ImageWithFallback
              src={slide.imageUrl}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/55 to-black/20" />
            <div className="absolute inset-0 flex items-center px-5 sm:px-16">
              <div className="max-w-xl text-white">
                <h1 className="text-lg sm:text-3xl lg:text-4xl font-extrabold leading-tight [text-wrap:balance]">
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <p className="mt-2 sm:mt-3 text-xs sm:text-base text-slate-200 line-clamp-2 max-w-lg">
                    {slide.subtitle}
                  </p>
                )}
                <div className="mt-3 sm:mt-5">
                  <button
                    type="button"
                    onClick={() =>
                      onSelectSection(slide.linkSection || 'latest')
                    }
                    className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold bg-[#007185] hover:bg-[#00879e] text-white rounded-lg transition-colors whitespace-nowrap"
                  >
                    تسوق الآن
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Manual Prev / Next Controls (desktop/tablet; mobile uses dots) */}
        {sliders.length > 1 && (
          <>
            <button
              type="button"
              onClick={() =>
                setActiveIndex((prev) =>
                  nextSlideIndex(prev, sliders.length, -1)
                )
              }
              aria-label="الشريحة السابقة"
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/45 hover:bg-black/70 text-white items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveIndex((prev) =>
                  nextSlideIndex(prev, sliders.length, 1)
                )
              }
              aria-label="الشريحة التالية"
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/45 hover:bg-black/70 text-white items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {sliders.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`انتقل إلى الشريحة ${idx + 1}`}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === activeIndex
                      ? 'w-7 bg-white'
                      : 'w-2 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <span className="sr-only">{current.title}</span>
    </section>
  );
}
