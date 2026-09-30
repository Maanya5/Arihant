"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import SplitHeroSection from "./SplitHeroSection";

interface SchoolData {
  _id: string;
  name: string;
  logo?: string;
  city: string;
}

const FALLBACK_SCHOOLS: SchoolData[] = [
  {
    _id: "dps",
    name: "Delhi Public School",
    city: "New Delhi",
    logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=120",
  },
  {
    _id: "st-xaviers",
    name: "St. Xavier's High School",
    city: "Mumbai",
    logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=120",
  },
  {
    _id: "gd-goenka",
    name: "G.D. Goenka Public School",
    city: "Gurugram",
    logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=120",
  },
  {
    _id: "army-school",
    name: "Army Public School",
    city: "Pune",
    logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=120",
  },
  {
    _id: "heritage",
    name: "The Heritage School",
    city: "Kolkata",
    logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=120",
  },
  {
    _id: "dav",
    name: "DAV Public School",
    city: "Chandigarh",
    logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=120",
  },
];

export default function KidsSection({ data }: { data: any }) {
  const heroData = data?.hero || {};
  const bgImage = heroData.hero_image_url || "/images/home/kid-hero-2.jpg";

  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/schools")
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setSchools(res.data);
        } else {
          setSchools(FALLBACK_SCHOOLS);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching schools for KidsSection:", err);
        setSchools(FALLBACK_SCHOOLS);
        setLoading(false);
      });
  }, []);

  // Limit schools to maximum of 8 for premium dashboard sizing
  const displaySchools = schools.slice(0, 8);

  return (
    <SplitHeroSection
      sectionId="kids"
      eyebrow="Playful Premium · Kids Collection"
      title="Smart Uniforms for School & Play"
      subtitle="Official school wear and casuals built to last through every active day."
      heroImage={bgImage}
      heroImageAlt="Kids fashion and uniforms at Arihant"
      heroImagePosition="center"
      ctaLabel="Select School"
      ctaHref="/uniform/select-school"
      direction="ltr"
      priority={false}
      categories={[]} // Categories unused since we override children
    >
      <div className="w-full">
        {/* Section Header for Right Side */}
        <div className="mb-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-teal)] block mb-2">
            Uniform Wizard
          </span>
          <h3 className="font-display font-bold text-[var(--color-ink)] text-2xl tracking-tight">
            Partner Schools
          </h3>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Select your school below to find the exact official uniform collections.
          </p>
        </div>

        {/* Responsive Grid of Uniform School Cards */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-[var(--color-surface-alt)] animate-shimmer"
                style={{ borderRadius: 0 }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:gap-5">
            {displaySchools.map((s) => (
              <Link
                key={s._id}
                href={`/uniform/${s._id}/gender`}
                className="bg-white border border-[#C8D9E6] p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:border-[#567C8D] hover:-translate-y-1 hover:bg-[#EEF4F8]"
                style={{ borderRadius: 0 }}
              >
                {/* Logo */}
                <div className="w-12 h-12 relative flex items-center justify-center mb-3">
                  <Image
                    src={s.logo || "/fallback-product.jpg"}
                    alt={s.name}
                    fill
                    sizes="48px"
                    className="object-contain"
                  />
                </div>

                {/* Name */}
                <h4 className="font-sans font-semibold text-[#2F4156] text-xs leading-snug uppercase tracking-wider line-clamp-2">
                  {s.name}
                </h4>

                {/* Area/City */}
                <p className="font-sans text-[#567C8D] text-[10px] uppercase tracking-widest mt-1.5 font-bold">
                  {s.city}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SplitHeroSection>
  );
}
