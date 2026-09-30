import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Login",
  description: "Login to your Arihant Store account to manage orders and checkout.",
};
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
