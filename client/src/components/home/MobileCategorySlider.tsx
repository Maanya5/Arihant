"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface CategoryItem {
  id: string;
  img: string;
  title: string;
  description?: string;
  href: string;
}

interface MobileCategorySliderProps {
  categories: CategoryItem[];
}

export default function MobileCategorySlider({ categories }: MobileCategorySliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observerOptions = {
      root: containerRef.current,
      threshold: 0.6, // Fire when 60% of the card is visible
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute("data-index"));
          if (!isNaN(index)) {
            setActiveIndex(index);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => {
      observer.disconnect();
    };
  }, [categories]);

  return (
    <div className="w-full py-8 bg-[var(--color-bg)]">
      {/* Slider Container */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto scroll-snap-type-x-mandatory -webkit-overflow-scrolling-touch gap-4 px-8 pb-6 no-scrollbar"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
        }}
      >
        {/* CSS to hide scrollbar */}
        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>

        {categories.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={item.id}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              data-index={index}
              className="w-[82vw] flex-shrink-0 scroll-snap-align-center transition-all duration-300 ease-out"
              style={{
                scrollSnapAlign: "center",
                transform: isActive ? "scale(1)" : "scale(0.95)",
                opacity: isActive ? 1 : 0.9,
              }}
            >
              <Link
                href={item.href}
                className="relative block aspect-[3/4] w-full overflow-hidden bg-[var(--color-surface-alt)] border border-[var(--color-navy)]/10"
                style={{ borderRadius: 0 }}
              >
                {/* Image */}
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  sizes="82vw"
                  className="object-cover"
                  priority={index === 0}
                />

                {/* Brand-aligned dark overlay gradient (Always visible on mobile for legibility) */}
                <div
                  className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[rgba(47,65,86,0.85)] to-transparent z-10"
                />

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-6 z-20 flex flex-col justify-end">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-display font-semibold text-white text-xl tracking-tight">
                      {item.title}
                    </h4>
                    <ArrowUpRight size={14} className="text-white flex-shrink-0" />
                  </div>
                  {item.description && (
                    <p className="text-[12px] text-[var(--color-sky)] mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center items-center gap-2 mt-2">
        {categories.map((_, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={index}
              onClick={() => {
                cardRefs.current[index]?.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                  inline: "center",
                });
              }}
              className="h-2 transition-all duration-300 ease-out"
              style={{
                width: isActive ? "20px" : "8px",
                backgroundColor: isActive ? "#2F4156" : "#C8D9E6",
                borderRadius: 0,
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
