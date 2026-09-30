import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Arihant Store Admin Panel — manage schools, uniforms, and orders.",
  robots: { index: false, follow: false },  // Don't index admin routes
};
