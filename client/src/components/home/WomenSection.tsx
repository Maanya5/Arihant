"use client";

import SplitHeroSection from "./SplitHeroSection";

interface CategoryData {
  id: string;
  title: string;
  description: string;
  img: string;
  href: string;
  height: 'large' | 'medium' | 'small';
}

const FALLBACK_WOMEN_CATEGORIES: CategoryData[] = [
  { 
    id: "kurtis", 
    img: "https://images.unsplash.com/photo-1741847639057-b51a25d42892?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8a3VydGl8ZW58MHx8MHx8fDA%3D", 
    title: "Kurtis", 
    description: "Everyday elegance and comfort", 
    href: "/products?category=kurtis", 
    height: "large" 
  },
  { 
    id: "ethnic", 
    img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800", 
    title: "Ethnic Wear", 
    description: "Timeless traditions and wear", 
    href: "/products?category=ethnic", 
    height: "large" 
  },
  { 
    id: "tops", 
    img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800", 
    title: "Tops", 
    description: "Modern silhouettes", 
    href: "/products?category=tops", 
    height: "medium" 
  },
  { 
    id: "ladies-wear", 
    img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800", 
    title: "Ladies Wear", 
    description: "Flowing beauty for any day", 
    href: "/products?category=ladies-wear", 
    height: "medium" 
  },
  { 
    id: "dress-materials", 
    img: "https://images.unsplash.com/photo-1509319117193-57bab727e09d?q=80&w=800", 
    title: "Dress Materials", 
    description: "Unstitched premium fabrics", 
    href: "/products?category=dress-materials", 
    height: "small" 
  },
];

export default function WomenSection({ data }: { data: any }) {
  const heroData = data?.hero || {};
  const cmsCategories = data?.categories || [];

  const bgImage = heroData.hero_image_url || "/images/home/women-hero-2.jpg";

  // Merge CMS categories with fallback images/heights if available
  const mappedCategories: CategoryData[] = cmsCategories.length > 0
    ? cmsCategories.map((cat: any, i: number) => {
        const fallback = FALLBACK_WOMEN_CATEGORIES[i % FALLBACK_WOMEN_CATEGORIES.length];
        return {
          id: cat._id || `cms-women-${i}`,
          title: cat.label || fallback.title,
          href: cat.link || fallback.href,
          description: fallback.description,
          img: fallback.img,
          height: fallback.height,
        };
      })
    : FALLBACK_WOMEN_CATEGORIES;

  return (
    <SplitHeroSection
      sectionId="women"
      eyebrow="Women's Collection · Seasonal Edit"
      title="Wear What You Love"
      subtitle="Curated ethnic and contemporary styles for every woman, every occasion."
      heroImage={bgImage}
      heroImageAlt="Women's fashion at Arihant"
      heroImagePosition="top center"
      ctaLabel="Explore Women's"
      ctaHref="/products?gender=women"
      direction="rtl"
      priority={false}
      categories={mappedCategories}
    />
  );
}
