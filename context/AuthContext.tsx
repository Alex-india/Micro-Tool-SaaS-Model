"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  plan: "free" | "pro";
  planType?: "monthly" | "yearly" | "lifetime";
  planName?: string;
  subscriptionDate?: string;
  renewalDate?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  authModalOpen: boolean;
  authMode: "login" | "signup";
  authReason: string | null;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  upgradeToPro: (planType: "monthly" | "yearly" | "lifetime") => Promise<void>;
  openAuthModal: (mode?: "login" | "signup", reason?: string) => void;
  closeAuthModal: () => void;
  setAuthMode: (mode: "login" | "signup") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "toolverse_user_session";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authReason, setAuthReason] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load auth state", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUser = (userData: User | null) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = async (email: string, pass: string): Promise<boolean> => {
    if (!email || !pass) return false;
    
    const name = email.split("@")[0] || "User";
    const loggedInUser: User = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email,
      plan: "free",
    };

    saveUser(loggedInUser);
    closeAuthModal();
    return true;
  };

  const signup = async (name: string, email: string, pass: string): Promise<boolean> => {
    if (!email || !pass || !name) return false;

    const newUser: User = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      name,
      email,
      plan: "free",
    };

    saveUser(newUser);
    closeAuthModal();
    return true;
  };

  const logout = () => {
    saveUser(null);
  };

  const upgradeToPro = async (planType: "monthly" | "yearly" | "lifetime") => {
    if (!user) {
      openAuthModal("signup", "Please sign in or create an account to activate your subscription.");
      return;
    }

    const planNameMap = {
      monthly: "Monthly Pro",
      yearly: "Yearly Pro",
      lifetime: "Lifetime Access",
    };

    const renewalMap = {
      monthly: "Renews monthly",
      yearly: "Renews annually",
      lifetime: "Perpetual License (Never)",
    };

    const updated: User = {
      ...user,
      plan: "pro",
      planType,
      planName: planNameMap[planType],
      subscriptionDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      renewalDate: renewalMap[planType],
    };

    saveUser(updated);
  };

  const openAuthModal = (mode: "login" | "signup" = "login", reason?: string) => {
    setAuthMode(mode);
    setAuthReason(reason || null);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setAuthReason(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        authModalOpen,
        authMode,
        authReason,
        login,
        signup,
        logout,
        upgradeToPro,
        openAuthModal,
        closeAuthModal,
        setAuthMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
