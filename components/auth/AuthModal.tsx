"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, ShieldCheck, Mail, KeyRound, User as UserIcon, Sparkles, CheckCircle2 } from "lucide-react";

export const AuthModal: React.FC = () => {
  const { authModalOpen, closeAuthModal, authMode, setAuthMode, authReason, login, signup } = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (authMode === "login") {
        if (!email || !password) {
          setError("Please enter your email and password.");
          setLoading(false);
          return;
        }
        const success = await login(email, password);
        if (!success) {
          setError("Invalid email or password.");
        }
      } else {
        if (!name || !email || !password) {
          setError("Please fill in all fields.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }
        const success = await signup(name, email, password);
        if (!success) {
          setError("Could not create account. Please try again.");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={authModalOpen} onClose={closeAuthModal} maxWidth="md">
      <div className="flex flex-col gap-5 py-1">
        {/* Header Title */}
        <div className="flex flex-col items-center text-center gap-1.5 px-1">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent mb-0.5 shadow-sm">
            <Lock className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-accent" />
          </div>
          <h3 className="text-lg sm:text-2xl font-extrabold text-text-primary tracking-tight">
            {authMode === "login" ? "Welcome Back to ToolVerse" : "Create your ToolVerse Account"}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-text-secondary">
            {authMode === "login"
              ? "Sign in to manage your subscription and saved history"
              : "Create an account for subscription access & Pro tools"}
          </p>
        </div>

        {/* Subscription Reason Banner (If triggered by subscription upgrade) */}
        {authReason ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 text-xs text-text-primary">
              <span className="font-bold text-amber-400">Subscription Required Action</span>
              <span className="font-medium text-text-secondary">{authReason}</span>
            </div>
          </div>
        ) : (
          /* Free Notice Banner */
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3 flex items-center gap-2.5 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-text-secondary font-medium">
              <strong className="text-emerald-400 font-bold">100% Free Tools:</strong> No login is needed to use free calculators & converters!
            </span>
          </div>
        )}

        {/* Tabs switcher */}
        <div className="flex bg-surface-raised border border-border p-1 rounded-lg w-full">
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setError("");
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-md transition-all ${
              authMode === "login"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("signup");
              setError("");
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-md transition-all ${
              authMode === "signup"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-400">
              {error}
            </div>
          )}

          {authMode === "signup" && (
            <Input
              label="Full Name"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              prefixSymbol="👤"
              required
            />
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            prefixSymbol="✉"
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            prefixSymbol="🔒"
            required
          />

          <Button
            variant="primary"
            size="md"
            type="submit"
            isLoading={loading}
            className="w-full font-bold mt-1"
          >
            {authMode === "login" ? "Sign In to Account" : "Create Account & Continue"}
          </Button>
        </form>

        {/* Demo Fast Login Trigger */}
        <div className="pt-2 border-t border-border flex flex-col gap-2.5 items-center text-center">
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              await login("demo.user@toolverse.com", "password123");
              setLoading(false);
            }}
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" /> Quick Demo Login as Subscriber
          </button>

          <p className="text-[11px] font-medium text-text-tertiary">
            By continuing, you agree to our Terms of Service & Privacy Policy.
          </p>
        </div>
      </div>
    </Modal>
  );
};
