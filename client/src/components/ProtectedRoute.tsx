"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/authStore";
import PageSpinner from "./PageSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (adminOnly && user?.role !== "admin") {
        router.push("/");
      }
    }
  }, [isAuthenticated, user, router, adminOnly, isLoaded]);

  if (!isLoaded || !isAuthenticated || (adminOnly && user?.role !== "admin")) {
    return <PageSpinner />;
  }

  return <>{children}</>;
}
