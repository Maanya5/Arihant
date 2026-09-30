"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser,
  getIdToken
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { login: setLocalUser, logout: clearLocalUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          // Get ID Token from Firebase
          const idToken = await getIdToken(firebaseUser);
          
          // Verify with Backend
          const response = await api.post("/auth/google", { idToken });
          
          // Sync with local AuthStore (JWT issued by backend)
          setLocalUser(response.data.user, response.data.token);
        } catch (error) {
          console.error("Auth sync failed:", error);
          // If backend verification fails, sign out from firebase too
          await signOut(auth);
          setUser(null);
          clearLocalUser();
        }
      } else {
        setUser(null);
        clearLocalUser();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setLocalUser, clearLocalUser]);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/");
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      clearLocalUser();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
