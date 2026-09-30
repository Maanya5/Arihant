"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Masonry from "@/components/ui/Masonry/Masonry";

export interface CategoryData {
  id: string | number;
  img: string;
  title: string;
  description: string;
  href: string;
  height: number;
}

interface CategoryEditorialSectionProps {
  title: string;
  subtitle: string;
  heroImage: string;
  categories: CategoryData[];
  accentColor: string;
  direction?: "ltr" | "rtl";
  bgColor?: string;
}

export default function CategoryEditorialSection({
  title,
  subtitle,
  heroImage,
  categories,
  accentColor,
  direction = "ltr",
  bgColor = "bg-[#FFFFFF]",
}: CategoryEditorialSectionProps) {
  
  return (
    <section className={`relative w-full ${bgColor}`}>
      {/* DESKTOP SPLIT LAYOUT (>=1024px) */}
      <div className={`hidden lg:flex w-full min-h-screen relative ${direction === "rtl" ? "flex-row-reverse" : "flex-row"}`}>
        
        {/* Left Side — Sticky Hero (55%) */}
        <div className="w-[55%] h-[100svh] sticky top-0 overflow-hidden group">
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={heroImage}
              alt={title}
              fill
              priority
              sizes="55vw"
              className="object-cover object-[50%_18%] transition-transform duration-[1.5s] ease-out group-hover:scale-[1.03] will-change-transform"
            />
          </motion.div>
          
          {/* Overlay gradient */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.45) 100%)"
            }}
          />

          {/* Hero Content */}
          <div className="absolute inset-x-0 bottom-0 p-16 lg:p-20 z-10">
            <motion.p
              className="text-eyebrow text-white/80 mb-4 tracking-[0.15em] uppercase"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {subtitle}
            </motion.p>
            
            <div className="mb-8">
              <StaggeredHeadline 
                text={title}
                className="font-display font-bold text-white leading-[0.92] text-[clamp(6rem,8vw,10rem)] tracking-[-0.02em]"
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Link 
                href="#shop" 
                className="inline-flex items-center gap-3 text-white font-medium text-sm tracking-widest uppercase hover:gap-5 transition-all duration-300"
              >
                Explore Collection
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Right Side — Masonry Categories (45%) */}
        <div className="w-[45%] min-h-screen pt-24 lg:pt-32">
           <Masonry 
             data={categories} 
             accentColor={accentColor}
             animateFrom={direction === "ltr" ? "right" : "left"}
           />
        </div>
      </div>

      {/* MOBILE LAYOUT (<1024px) */}
      <div className="flex lg:hidden flex-col w-full relative">
        {/* Mobile Top Hero */}
        <div className="relative w-full h-[70svh] overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={heroImage}
              alt={title}
              fill
              priority
              sizes="100vw"
              className="object-cover object-[50%_18%] will-change-transform"
            />
          </motion.div>
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.65) 100%)"
            }}
          />
          
          {/* Mobile Hero Content */}
          <div className="absolute inset-x-0 bottom-0 p-8 z-10 pb-16">
            <motion.p
              className="text-eyebrow text-white/80 mb-3 tracking-[0.1em] uppercase text-xs"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {subtitle}
            </motion.p>
            <StaggeredHeadline 
              text={title}
              className="font-display font-bold text-white leading-[0.92] text-7xl tracking-tight mb-4"
            />
            <Link 
              href="#shop" 
              className="inline-flex items-center gap-2 text-white/90 text-sm tracking-wider uppercase border-b border-white/30 pb-1"
            >
              Explore Collection <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Mobile Horizontal Slider */}
        <div className="w-full relative -mt-8 z-20 pb-16">
          <MobileCarousel categories={categories} accentColor={accentColor} />
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------
// Sub-component: Mobile Carousel with IntersectionObserver
// ----------------------------------------------------
function MobileCarousel({ categories, accentColor }: { categories: CategoryData[], accentColor: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = window.innerWidth * 0.82 + 16; // 82vw + gap
      const index = Math.round(scrollLeft / cardWidth);
      if (index !== activeIndex && index >= 0 && index < categories.length) {
        setActiveIndex(index);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeIndex, categories.length]);

  return (
    <div className="w-full">
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory px-6 gap-4 pb-8"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          ::-webkit-scrollbar { display: none; }
        `}} />
        
        {categories.map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <Link 
              key={item.id} 
              href={item.href}
              className="snap-center shrink-0 relative rounded-3xl overflow-hidden shadow-xl"
              style={{ 
                width: '82vw', 
                height: '420px',
                transform: `scale(${isActive ? 1 : 0.95})`,
                transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)'
              }}
            >
              <Image
                src={item.img}
                alt={item.title}
                fill
                sizes="82vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
              
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="text-white font-display text-2xl font-medium mb-1 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-white/70 text-sm line-clamp-1 mb-4">
                  {item.description}
                </p>
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: isActive ? accentColor : 'rgba(255,255,255,0.2)' }}
                >
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center items-center gap-2 mt-2">
        {categories.map((_, i) => (
          <div 
            key={i}
            className="rounded-full transition-all duration-300"
            style={{ 
              width: i === activeIndex ? '24px' : '6px',
              height: '6px',
              backgroundColor: i === activeIndex ? accentColor : '#D1D5DB' // tailwind gray-300
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-component: Staggered Headline
// ----------------------------------------------------
function StaggeredHeadline({ text, className }: { text: string; className: string }) {
  const words = text.split(" ");
  return (
    <h1 className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em] last:mr-0 pb-1">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              delay: 0.2 + i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}
