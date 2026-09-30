import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Select Your School",
  description: "Browse the list of schools and find your school's official uniform collection on Arihant Store.",
};
export default function SelectSchoolLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
