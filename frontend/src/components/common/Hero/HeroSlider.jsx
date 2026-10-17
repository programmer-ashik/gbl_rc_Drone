// src/components/home/HeroSlider/HeroSlider.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon/Icon";
import { Button } from "../../common/Button/Button";
import { ROUTES } from "../../../constants";

export const HeroSlider = ({ slides, loading = false }) => {
  const items = (slides?.length ? slides : []).map((slide, index) => ({
    id: slide._id || slide.id || index,
    title: slide.title,
    subtitle: slide.subtitle,
    description: slide.description,
    badge: slide.badge || "GBLrcDrone",
    ctaText: slide.ctaText || "Shop now",
    ctaLink: slide.ctaLink || ROUTES.PRODUCTS,
    secondaryCtaText: slide.secondaryCtaText || "Learn more",
    secondaryCtaLink: slide.secondaryCtaLink || ROUTES.ABOUT,
    image: slide.image || "",
    videoUrl: slide.videoUrl || "",
  }));
  const [currentSlide, setCurrentSlide] = useState(0);

  const slideCount = items.length;

  useEffect(() => {
    setCurrentSlide(0);
  }, [slideCount]);

  useEffect(() => {
    if (slideCount <= 1) return undefined;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 6000);
    return () => clearInterval(timer);
  }, [slideCount]);

  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % Math.max(slideCount, 1));
  const prevSlide = () =>
    setCurrentSlide(
      (prev) => (prev - 1 + Math.max(slideCount, 1)) % Math.max(slideCount, 1),
    );
  const slide = items[currentSlide] || items[0];

  if (loading && !slide) {
    return (
      <div className='h-[clamp(420px,min(40vw,70vh),760px)] w-full animate-pulse bg-background-secondary' />
    );
  }
  if (!slide) return null;

  return (
    <div className='relative h-[clamp(420px,min(40vw,70vh),760px)] w-full overflow-hidden'>
      {/* Dynamic Background Media (Video or Image) */}
      <div className='absolute inset-0 w-full h-full overflow-hidden z-0'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={`bg-${slide.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className='absolute inset-0 w-full h-full'
          >
            {slide.videoUrl ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                className='absolute inset-0 w-full h-full object-cover filter brightness-[0.45] contrast-110'
              >
                <source src={slide.videoUrl} type='video/mp4' />
                Your browser does not support the video tag.
              </video>
            ) : slide.image ? (
              <img
                src={slide.image}
                alt={slide.title || "Slide background"}
                className='absolute inset-0 h-full w-full object-cover'
              />
            ) : (
              /* Fallback video if neither videoUrl nor image is provided */
              <video
                autoPlay
                loop
                muted
                playsInline
                className='absolute inset-0 w-full h-full object-cover filter brightness-[0.45] contrast-110'
              >
                <source
                  src='https://res.cloudinary.com/dba0ebn3c/video/upload/v1787647254/25060-347958043_medium_s8c91x.mp4'
                  type='video/mp4'
                />
              </video>
            )}
          </motion.div>
        </AnimatePresence>
        <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent' />
      </div>

      {/* Main Container with Fixed Height */}
      <div className='site-container relative z-10 flex h-full flex-col justify-center'>
        {/* Fixed Content Wrapper to Prevent Shifting */}
        <div className='w-full max-w-2xl h-[280px] sm:h-[300px] flex flex-col justify-center'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className='flex flex-col items-start'
            >
              {/* Badge */}
              <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/20 border border-warning/40 text-warning text-xs sm:text-sm font-semibold mb-3 backdrop-blur-md shadow-sm'>
                <span>{slide.badge}</span>
              </div>

              {/* Subtitle / Catchphrase */}
              <p className='text-xs sm:text-sm font-bold text-warning mb-1 uppercase tracking-wider drop-shadow'>
                {slide.subtitle}
              </p>

              {/* Main Title */}
              <h1 className='text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-3 leading-tight drop-shadow-md'>
                {slide.title}
              </h1>

              {/* Description */}
              <p className='text-xs sm:text-sm lg:text-base text-gray-400 mb-6 line-clamp-2 sm:line-clamp-3 drop-shadow'>
                {slide.description}
              </p>

              {/* Action Buttons */}
              <div className='flex flex-wrap items-center gap-3'>
                <Link to={slide.ctaLink || ROUTES.PRODUCTS}>
                  <Button
                    variant='solid'
                    size='md'
                    className='bg-warning text-white hover:bg-warning/90 font-medium px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg shadow-warning/30 transition-all text-xs sm:text-sm cursor-pointer'
                  >
                    {slide.ctaText}
                    <Icon name='arrow-right' size={4} className='ml-2' />
                  </Button>
                </Link>

                {slide.secondaryCtaText ? (
                  <Link to={slide.secondaryCtaLink || ROUTES.ABOUT}>
                    <Button
                      variant='outline'
                      size='md'
                      className='bg-gray-400 backdrop-blur-md border-border text-gray-50 hover:bg-warning-bg hover:text-warning hover:border-warning/50 font-medium px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all text-xs sm:text-sm'
                    >
                      {slide.secondaryCtaText}
                    </Button>
                  </Link>
                ) : null}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Controls (Arrows & Indicators) */}
        <div className='absolute bottom-6 right-4 z-20 flex items-center gap-4 sm:right-6 lg:right-8'>
          {/* Indicators */}
          <div className='flex items-center gap-1.5'>
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === index
                    ? "w-8 bg-warning"
                    : "w-2 bg-white/40 hover:bg-white"
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
              className='p-2 rounded-lg bg-background/50 backdrop-blur-md border border-white/20 text-white hover:bg-warning hover:text-white transition-colors'
            >
              <Icon name='chevron-right' size={4} className='rotate-180' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={nextSlide}
              aria-label='Next slide'
              className='p-2 rounded-lg bg-background/50 backdrop-blur-md border border-white/20 text-white hover:bg-warning hover:text-white transition-colors'
            >
              <Icon name='chevron-right' size={4} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSlider;
