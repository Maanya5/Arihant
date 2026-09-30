import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Review your selected school uniforms and proceed to checkout.",
};
export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
