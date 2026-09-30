"use client";

import { motion } from "framer-motion";
import React from "react";

interface FadeInUpProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export default function FadeInUp({
  children,
  delay = 0,
  className,
  as = "div",
}: FadeInUpProps) {
  // Resolve the tag name to the corresponding motion component (defaults to motion.div)
  const Component = (motion as any)[as] || motion.div;

  return (
    <Component
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: { opacity: 0, y: 48 },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.65,
            ease: [0.22, 1, 0.36, 1], // Premium exponential ease-out
            delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </Component>
  );
}
