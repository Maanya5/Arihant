import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Checkout",
  description: "Securely complete your school uniform order with UPI payment or Cash on Delivery.",
};
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
