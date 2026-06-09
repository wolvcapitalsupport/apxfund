'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function AnimatedHero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const slides = [
    { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070', alt: 'Corporate HQ' },
    { url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2070', alt: 'Digital Assets' },
    { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047', alt: 'Financial Growth' }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [slides.length])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={slide.url}
              alt={slide.alt}
              fill
              className={`object-cover transition-transform duration-[8000ms] ease-linear ${
                index === currentSlide ? 'scale-110' : 'scale-100'
              }`}
              priority={index === 0}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a14]/90 via-[#0a0a14]/60 to-[#0a0a14] z-10" />
      </div>
      
      <div className="relative z-20 text-center px-6 max-w-4xl">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Redefining <span className="text-[#c9a84c]">Financial</span> Freedom
        </h1>
        <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
          Secure your future with APXFund’s institutional-grade investment strategies.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-[#c9a84c] text-black px-10 py-4 rounded-full font-bold hover:bg-white transition-colors">
            Start Investing
          </button>
          <button className="border border-white/20 text-white px-10 py-4 rounded-full font-bold hover:bg-white/10 transition-colors backdrop-blur-sm">
            View Plans
          </button>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex gap-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === currentSlide ? 'bg-[#c9a84c] w-12' : 'bg-white/20 w-6'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
