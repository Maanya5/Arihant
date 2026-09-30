import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Create Account",
  description: "Register a new account on Arihant Store to order school uniforms quickly and track your deliveries.",
};
export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
