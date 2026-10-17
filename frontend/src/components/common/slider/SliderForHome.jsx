// src/components/home/HeroSlider/SliderForHome.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon/Icon";
import { Button } from "../../common/Button/Button";

const SLIDES = [
  {
    id: 1,
    image:
      "https://res.cloudinary.com/dba0ebn3c/image/upload/v1785174952/Quadcopter_drone_edn26i.jpg",
    alt: "Quadcopter Drone 1",
  },
  {
    id: 2,
    image:
      "https://res.cloudinary.com/dba0ebn3c/image/upload/v1785174952/Quadcopter_drone_edn26i.jpg",
    alt: "Quadcopter Drone 2",
  },
  {
    id: 3,
    image:
      "https://res.cloudinary.com/dba0ebn3c/image/upload/v1785174952/Quadcopter_drone_edn26i.jpg",
    alt: "Quadcopter Drone 3",
  },
  {
    id: 4,
    image:
      "https://res.cloudinary.com/dba0ebn3c/image/upload/v1785174952/Quadcopter_drone_edn26i.jpg",
    alt: "Quadcopter Drone 4",
  },
  {
    id: 5,
    image:
      "https://res.cloudinary.com/dba0ebn3c/image/upload/v1785174952/A_digital_blueprint_of_a_quadcopter_drone_rendered_in_a_neon_blue_wireframe_style__y8kocm.jpg",
    alt: "Neon Digital Blueprint Quadcopter",
  },
];

export const SliderForHome = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const slide = SLIDES[currentSlide];

  return (
    <div className='relative overflow-hidden rounded-2xl border border-border my-4 h-[320px] sm:h-[400px] lg:h-[460px] w-full bg-white'>
      {/* Background Image Carousel with Framer Motion Crossfade */}
      <div className='absolute inset-0 w-full h-full overflow-hidden z-0'>
        <AnimatePresence mode='popLayout'>
          <motion.img
            key={slide.image + currentSlide}
            src={slide.image}
            alt={slide.alt}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className='absolute inset-0 w-full h-full object-cover'
          />
        </AnimatePresence>
      </div>

      {/* Carousel Controls (Arrows & Indicators) */}
      <div className='absolute bottom-6 right-6 sm:right-10 flex items-center gap-4 z-20'>
        {/* Indicators */}
        <div className='flex items-center gap-1.5'>
          {SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2 rounded-full transition-all ${
                currentSlide === index
                  ? "w-8 bg-warning"
                  : "w-2 bg-gray-300 hover:bg-gray-500"
              }`}
            />
          ))}
        </div>

        {/* Next / Prev Buttons */}
        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            size='sm'
            onClick={prevSlide}
            aria-label='Previous slide'
            className='p-2 rounded-lg bg-white/80 backdrop-blur-md border border-gray-200 text-gray-800 hover:bg-warning hover:text-white transition-colors'
          >
            <Icon name='chevron-right' size={4} className='rotate-180' />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={nextSlide}
            aria-label='Next slide'
            className='p-2 rounded-lg bg-white/80 backdrop-blur-md border border-gray-200 text-gray-800 hover:bg-warning hover:text-white transition-colors'
          >
            <Icon name='chevron-right' size={4} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SliderForHome;
