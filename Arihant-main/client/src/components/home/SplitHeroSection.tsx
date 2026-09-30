"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import MasonryGrid from "../ui/Masonry/MasonryGrid";
import MobileCategorySlider from "./MobileCategorySlider";

interface CategoryItem {
  id: string;
  img: string;
  title: string;
  description?: string;
  href: string;
  height: 'large' | 'medium' | 'small';
}

interface SplitHeroSectionProps {
  title: string;
  subtitle: string;
  eyebrow: string;
  heroImage: string;
  heroImageAlt: string;
  heroImagePosition?: string;
  categories: CategoryItem[];
  ctaLabel: string;
  ctaHref: string;
  direction?: 'ltr' | 'rtl';
  priority?: boolean;
  sectionId: string;
  children?: React.ReactNode; // Allows custom right-side component (e.g. Kids school grid)
}

export default function SplitHeroSection({
  title,
  subtitle,
  eyebrow,
  heroImage,
  heroImageAlt,
  heroImagePosition = "center",
  categories,
  ctaLabel,
  ctaHref,
  direction = "ltr",
  priority = false,
  sectionId,
  children,
}: SplitHeroSectionProps) {
  const isRtl = direction === "rtl";

  return (
    <section id={sectionId} className="w-full">
      {/* 💻 DESKTOP LAYOUT (≥1024px) */}
      <div
        className={`hidden lg:flex w-full min-h-screen ${
          isRtl ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Sticky Campaign Image Panel (55% width) */}
        <div className="sticky top-0 h-screen w-[55%] overflow-hidden flex-shrink-0 z-20">
          <Image
            src={heroImage}
            alt={heroImageAlt}
            fill
            priority={priority}
            className="object-cover"
            style={{ objectPosition: heroImagePosition }}
            sizes="55vw"
          />

          {/* Brand-aligned gradient overlay */}
          <div
            style={{
              background:
                "linear-gradient(180deg, rgba(47,65,86,0.05) 0%, rgba(47,65,86,0.55) 100%)",
            }}
            className="absolute inset-0 z-10"
          />

          {/* Overlay Content */}
          <div className="absolute bottom-0 left-0 p-16 max-w-[560px] z-20">
            {/* Eyebrow */}
            <motion.p
              className="section-eyebrow !text-[#C8D9E6] mb-4"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {eyebrow}
            </motion.p>

            {/* Headline — staggered words */}
            <div className="overflow-hidden mb-6 flex flex-wrap">
              {title.split(" ").map((word, i) => (
                <motion.span
                  key={i}
                  className="inline-block mr-3 font-display font-bold text-white leading-tight"
                  style={{
                    fontSize: "clamp(2.8rem, 5.5vw, 4.8rem)",
                    letterSpacing: "-0.02em",
                  }}
                  initial={{ y: "110%", opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.7,
                    delay: 0.2 + i * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </div>

            {/* Subtitle */}
            <motion.p
              className="text-[#C8D9E6] text-base leading-relaxed mb-8 max-w-[400px]"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {subtitle}
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={ctaHref} className="btn-primary">
                <span>{ctaLabel}</span>
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Scrollable Categories / Children Panel (45% width) */}
        <div className="flex-1 bg-[#F5EFEB] py-24 px-12 xl:px-16 flex flex-col justify-start">
          {children ? children : <MasonryGrid categories={categories} />}
        </div>
      </div>

      {/* 📱 MOBILE LAYOUT (<1024px) */}
      <div className="block lg:hidden w-full bg-[var(--color-bg)]">
        {/* Top Hero Image */}
        <div className="relative w-full h-[60svh] overflow-hidden">
          <Image
            src={heroImage}
            alt={heroImageAlt}
            fill
            priority={priority}
            className="object-cover"
            style={{ objectPosition: heroImagePosition }}
            sizes="100vw"
          />

          {/* Brand gradient overlay */}
          <div
            style={{
              background:
                "linear-gradient(180deg, rgba(47,65,86,0.1) 0%, rgba(47,65,86,0.65) 100%)",
            }}
            className="absolute inset-0 z-10"
          />

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 p-8 w-full z-20">
            <p className="section-eyebrow !text-[#C8D9E6] mb-2">{eyebrow}</p>
            <h2
              className="font-display font-bold text-white leading-tight mb-4"
              style={{ fontSize: "clamp(2rem, 8vw, 2.8rem)" }}
            >
              {title}
            </h2>
            <Link
              href={ctaHref}
              className="btn-primary inline-flex items-center gap-2 text-xs py-3.5 px-6"
            >
              <span>{ctaLabel}</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Bottom Content */}
        <div className="w-full">
          {children ? (
            <div className="py-8 px-6 bg-[var(--color-bg)]">{children}</div>
          ) : (
            <MobileCategorySlider categories={categories} />
          )}
        </div>
      </div>
    </section>
  );
}
