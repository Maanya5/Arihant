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

const FALLBACK_MEN_CATEGORIES: CategoryData[] = [
  { 
    id: "shirts", 
    img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800", 
    title: "Shirts", 
    description: "Crisp and classic", 
    href: "/products?category=shirts", 
    height: "large" 
  },
  { 
    id: "t-shirts", 
    img: "https://images.unsplash.com/photo-1592994238317-fcf75c5466fd?q=80&w=800", 
    title: "T-Shirts", 
    description: "Active everyday wear", 
    href: "/products?category=t-shirts", 
    height: "medium" 
  },
  { 
    id: "jeans", 
    img: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800", 
    title: "Jeans", 
    description: "Durable and modern denim", 
    href: "/products?category=jeans", 
    height: "large" 
  },
  { 
    id: "kurtas", 
    img: "https://images.unsplash.com/photo-1727835523550-18478cacefa2?q=80&w=800", 
    title: "Kurtas", 
    description: "Traditional refinement", 
    href: "/products?category=kurtas", 
    height: "medium" 
  },
  { 
    id: "ethnic", 
    img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800", 
    title: "Ethnic Wear", 
    description: "Ceremonial elegance", 
    href: "/products?category=ethnic", 
    height: "small" 
  },
  { 
    id: "readymade", 
    img: "https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?q=80&w=800", 
    title: "Readymade", 
    description: "Daily casual defaults", 
    href: "/products", 
    height: "small" 
  },
];

export default function MenSection({ data }: { data: any }) {
  const heroData = data?.hero || {};
  const cmsCategories = data?.categories || [];

  const bgImage = heroData.hero_image_url || "/images/home/men-hero-4.jpg";

  // Merge CMS categories with fallback images/heights if available
  const mappedCategories: CategoryData[] = cmsCategories.length > 0
    ? cmsCategories.map((cat: any, i: number) => {
        const fallback = FALLBACK_MEN_CATEGORIES[i % FALLBACK_MEN_CATEGORIES.length];
        return {
          id: cat._id || `cms-men-${i}`,
          title: cat.label || fallback.title,
          href: cat.link || fallback.href,
          description: fallback.description,
          img: fallback.img,
          height: fallback.height,
        };
      })
    : FALLBACK_MEN_CATEGORIES;

  return (
    <SplitHeroSection
      sectionId="men"
      eyebrow="Men's Collection · New Season"
      title="Crafted for the Modern Man"
      subtitle="Premium readymade garments — from everyday essentials to ceremonial elegance."
      heroImage={bgImage}
      heroImageAlt="Men's fashion at Arihant"
      heroImagePosition="center"
      ctaLabel="Explore Men's"
      ctaHref="/products?gender=men"
      direction="ltr"
      categories={mappedCategories}
    />
  );
}
