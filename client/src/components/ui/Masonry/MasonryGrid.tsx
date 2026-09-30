"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
// @ts-ignore
import gsap from "gsap";
// @ts-ignore
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface CategoryItem {
  id: string;
  img: string;
  title: string;
  description?: string;
  href: string;
  height: 'large' | 'medium' | 'small';
}

interface MasonryGridProps {
  categories: CategoryItem[];
}

const HEIGHT_MAP = {
  large: "h-[520px]",
  medium: "h-[360px]",
  small: "h-[260px]",
};

export default function MasonryGrid({ categories }: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".masonry-card", {
        opacity: 0,
        y: 48,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          once: true,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Split categories into two columns for desktop masonry effect
  const leftCol: CategoryItem[] = [];
  const rightCol: CategoryItem[] = [];

  categories.forEach((item, index) => {
    if (index % 2 === 0) {
      leftCol.push(item);
    } else {
      rightCol.push(item);
    }
  });

  const renderCard = (item: CategoryItem) => {
    const heightClass = HEIGHT_MAP[item.height] || HEIGHT_MAP.medium;

    return (
      <Link
        key={item.id}
        href={item.href}
        className={`masonry-card relative w-full ${heightClass} bg-[var(--color-surface-alt)] overflow-hidden cursor-pointer group border border-transparent hover:border-[rgba(200,217,230,0.6)] transition-colors duration-300 block`}
        style={{ borderRadius: 0 }}
      >
        {/* Next.js Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={item.img}
            alt={item.title}
            fill
            sizes="(max-width: 1024px) 100vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        </div>

        {/* Brand-aligned dark overlay gradient (sliding up on hover) */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[rgba(47,65,86,0.85)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-250 z-10"
        />

        {/* Content (slides up and fades in on hover) */}
        <div className="absolute inset-x-0 bottom-0 p-6 z-20 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out flex flex-col justify-end">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-display font-semibold text-white text-xl tracking-tight">
              {item.title}
            </h4>
            <ArrowUpRight size={14} className="text-white flex-shrink-0" />
          </div>
          {item.description && (
            <p className="text-[12px] text-[var(--color-sky)] mt-1.5 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div
      ref={containerRef}
      className="masonry-grid grid grid-cols-2 gap-6 w-full"
    >
      {/* Column 1 */}
      <div className="flex flex-col gap-6 w-full">
        {leftCol.map(renderCard)}
      </div>

      {/* Column 2 */}
      <div className="flex flex-col gap-6 w-full pt-12">
        {rightCol.map(renderCard)}
      </div>
    </div>
  );
}
