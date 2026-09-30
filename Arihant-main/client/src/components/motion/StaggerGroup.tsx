"use client";

import { motion } from "framer-motion";
import React, { Children } from "react";

interface StaggerGroupProps {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
  childClassName?: string;
}

export default function StaggerGroup({
  children,
  stagger = 0.1,
  className,
  childClassName,
}: StaggerGroupProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: stagger,
            delayChildren: 0.1,
          },
        },
      }}
      className={className}
    >
      {Children.map(children, (child) => {
        if (!child) return null;
        return (
          <motion.div
            className={childClassName}
            variants={{
              hidden: { opacity: 0, y: 48 },
              show: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.65,
                  ease: [0.22, 1, 0.36, 1],
                },
              },
            }}
          >
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
