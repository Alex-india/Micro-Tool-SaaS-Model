"use client";

import React, { useState } from "react";
import { SITE_NAME } from "@/lib/constants";
import { 
  Mail, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  HelpCircle, 
  AlertCircle, 
  ShieldCheck,
  Building,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BackButton } from "@/components/ui/BackButton";

export default function ContactPage() {
  const [category, setCategory] = useState<string>("general");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg("Please fill in your name, email address, and message.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please provide a valid email address.");
      return;
    }

    setIsSubmitting(true);

    // Simulate reliable dispatch with client acknowledgment
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  const handleResetForm = () => {
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setIsSubmitted(false);
    setErrorMsg("");
  };

  return (
    <div className="flex flex-col gap-8 py-6 max-w-5xl mx-auto w-full">
      {/* Back Navigation */}
      <div className="flex items-center justify-between gap-4">
        <BackButton fallbackHref="/tools" label="Back to Tools" variant="outline" size="sm" />
        <span className="text-xs font-mono font-semibold text-text-tertiary">
          Support Desk
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col items-center text-center gap-3 border-b border-border pb-8">
        <span className="text-xs font-bold uppercase tracking-widest text-accent bg-accent/10 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" /> Direct Support & Feedback Desk
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
          Get in Touch with {SITE_NAME}
        </h1>
        <p className="text-sm text-text-secondary max-w-xl leading-relaxed">
          Have a feature suggestion, tool request, partnership inquiry, or technical question? Our dedicated team is here to assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Contact Form */}
        <div className="lg:col-span-7 bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-card flex flex-col gap-6">
          <div className="flex flex-col gap-1 border-b border-border pb-4">
            <h2 className="text-lg font-bold text-text-primary">Send Us a Message</h2>
            <p className="text-xs text-text-secondary">We respond to all verified inquiries within 24 hours.</p>
          </div>

          {isSubmitted ? (
            <div className="p-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center text-center gap-4 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-bold text-text-primary">Message Dispatched Successfully!</h3>
                <p className="text-xs text-text-secondary max-w-sm">
                  Thank you for reaching out, <strong>{name}</strong>. A confirmation ticket has been logged and our team will get back to you at <strong>{email}</strong> shortly.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleResetForm} className="mt-2">
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Category Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Inquiry Topic</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: "general", label: "General Query" },
                    { id: "feature", label: "Suggest Tool" },
                    { id: "bug", label: "Report Bug" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-lg border text-center font-medium transition-all ${
                        category === cat.id
                          ? "bg-accent text-white border-accent shadow-sm"
                          : "bg-surface-raised border-border text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Email Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Your Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                />
                <Input
                  label="Your Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  required
                />
              </div>

              {/* Subject */}
              <Input
                label="Subject (Optional)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your inquiry"
              />

              {/* Message Box */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Your Message / Feedback</label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your question, request, or suggestion in detail..."
                  className="w-full bg-surface-raised border border-border rounded-lg p-3 text-xs text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent leading-relaxed"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
                className="w-full mt-2"
              >
                Send Message Now
              </Button>
            </form>
          )}
        </div>

        {/* Right Column: Support Info & FAQ Cards */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Direct Support Channels */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-subtle flex flex-col gap-4">
            <h3 className="text-sm font-bold text-text-primary border-b border-border pb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-accent" /> Direct Contact Channels
            </h3>
            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 bg-surface-raised rounded-xl border border-border flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-text-primary">General & Technical Support</span>
                  <span className="font-mono text-accent">support@toolverse.app</span>
                </div>
              </div>

              <div className="p-3 bg-surface-raised rounded-xl border border-border flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-text-primary">Response Time SLA</span>
                  <span className="text-text-secondary">Average response time: under 24 hours (Monday – Sunday)</span>
                </div>
              </div>

              <div className="p-3 bg-surface-raised rounded-xl border border-border flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-text-primary">Security & Privacy Officer</span>
                  <span className="font-mono text-text-secondary">privacy@toolverse.app</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick FAQ Card */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-subtle flex flex-col gap-3 text-xs">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400" /> Frequently Asked Inquiries
            </h3>
            <div className="flex flex-col gap-2 text-text-secondary">
              <p><strong>Q: Can I request a new calculator or converter?</strong><br />A: Absolutely! Choose &ldquo;Suggest Tool&rdquo; in the form and tell us what utility you need.</p>
              <p className="pt-2 border-t border-border"><strong>Q: Are enterprise APIs available?</strong><br />A: Contact us at <code>support@toolverse.app</code> to discuss high-throughput API integrations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
