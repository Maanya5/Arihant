"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface MasonryCategory {
  id: string | number;
  img: string;
  title: string;
  description: string;
  href: string;
  height: number;
}

interface MasonryProps {
  data: MasonryCategory[];
  accentColor?: string;
  animateFrom?: "bottom" | "left" | "right";
  blurToFocus?: boolean;
  scaleOnHover?: boolean;
  ease?: string;
  duration?: number;
  stagger?: number;
}

export default function Masonry({
  data,
  accentColor = "#000",
  animateFrom = "bottom",
  blurToFocus = true,
  scaleOnHover = true,
  ease = "power3.out",
  duration = 0.8,
  stagger = 0.08,
}: MasonryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Set initial state
      gsap.set(itemsRef.current, {
        y: animateFrom === "bottom" ? 100 : 0,
        x: animateFrom === "left" ? -100 : animateFrom === "right" ? 100 : 0,
        opacity: 0,
        filter: blurToFocus ? "blur(10px)" : "none",
      });

      // Animate in
      gsap.to(itemsRef.current, {
        y: 0,
        x: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: duration,
        ease: ease,
        stagger: stagger,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [animateFrom, blurToFocus, duration, ease, stagger]);

  // Separate into 2 columns for desktop masonry
  const col1: MasonryCategory[] = [];
  const col2: MasonryCategory[] = [];
  
  data.forEach((item, i) => {
    if (i % 2 === 0) col1.push(item);
    else col2.push(item);
  });

  return (
    <div 
      ref={containerRef} 
      className="grid grid-cols-2 gap-4 md:gap-6 w-full h-full p-6 md:p-12 lg:p-16 overflow-y-auto scrollbar-none"
      style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
    >
      {/* Column 1 */}
      <div className="flex flex-col gap-4 md:gap-6">
        {col1.map((item, i) => {
          const index = i * 2;
          return (
            <MasonryCard
              key={item.id}
              item={item}
              accentColor={accentColor}
              scaleOnHover={scaleOnHover}
              ref={(el) => {
                itemsRef.current[index] = el;
              }}
            />
          );
        })}
      </div>

      {/* Column 2 */}
      <div className="flex flex-col gap-4 md:gap-6 mt-12 md:mt-24">
        {col2.map((item, i) => {
          const index = i * 2 + 1;
          return (
            <MasonryCard
              key={item.id}
              item={item}
              accentColor={accentColor}
              scaleOnHover={scaleOnHover}
              ref={(el) => {
                itemsRef.current[index] = el;
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

const MasonryCard = React.forwardRef<
  HTMLAnchorElement,
  { item: MasonryCategory; accentColor: string; scaleOnHover: boolean }
>(({ item, accentColor, scaleOnHover }, ref) => {
  return (
    <Link
      ref={ref}
      href={item.href}
      className={`group relative rounded-3xl overflow-hidden block cursor-pointer bg-neutral-100 will-change-transform`}
      style={{ height: `${item.height}px` }}
    >
      <div
        className={`absolute inset-0 w-full h-full transition-transform duration-700 ease-out ${
          scaleOnHover ? "group-hover:scale-105" : ""
        }`}
        style={{ transformOrigin: "center center" }}
      >
        <Image
          src={item.img}
          alt={item.title}
          fill
          sizes="(max-width: 1024px) 50vw, 25vw"
          className="object-cover"
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-6 flex items-end justify-between">
        <div>
          <h3 className="text-white font-display text-2xl md:text-3xl font-medium mb-1 tracking-tight">
            {item.title}
          </h3>
          <p className="text-white/70 text-sm tracking-wide">
            {item.description}
          </p>
        </div>
        
        {/* Arrow Circle */}
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out"
          style={{ backgroundColor: accentColor }}
        >
          <ArrowRight className="w-5 h-5 text-white" />
        </div>
      </div>
    </Link>
  );
});

MasonryCard.displayName = "MasonryCard";
