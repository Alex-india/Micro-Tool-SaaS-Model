"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Globe, Check, ChevronDown, Search } from "lucide-react";

interface LanguageSelectorProps {
  variant?: "header" | "footer" | "mobile";
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = "header",
  className = "",
}) => {
  const { currentLanguage, supportedLanguages, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredLanguages = supportedLanguages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      lang.region.toLowerCase().includes(searchFilter.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleSelect = (code: string) => {
    changeLanguage(code);
    setIsOpen(false);
    setSearchFilter("");
  };

  const getShortCode = (code: string) => {
    if (code === "zh-CN") return "ZH";
    return code.toUpperCase();
  };

  if (variant === "mobile") {
    return (
      <div className={`skiptranslate notranslate w-full flex flex-col gap-2 ${className}`} translate="no">
        <div className="skiptranslate notranslate flex items-center justify-between text-xs font-bold text-text-tertiary uppercase tracking-wider px-1" translate="no">
          <span className="skiptranslate notranslate flex items-center gap-1.5" translate="no">
            <Globe className="w-3.5 h-3.5 text-accent" /> Select Language
          </span>
          <span className="skiptranslate notranslate text-[10px] text-text-tertiary font-mono" translate="no">12 Languages</span>
        </div>

        <div className="skiptranslate notranslate grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1" translate="no">
          {supportedLanguages.map((lang) => {
            const isSelected = currentLanguage.code === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                translate="no"
                onClick={() => handleSelect(lang.code)}
                className={`skiptranslate notranslate flex items-center justify-between p-2 rounded-lg border text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-accent/15 border-accent text-accent font-bold"
                    : "bg-surface-raised border-border text-text-secondary hover:text-text-primary hover:border-border-hover"
                }`}
              >
                <div className="skiptranslate notranslate flex items-center gap-2 truncate" translate="no">
                  <span className="skiptranslate notranslate w-6 h-5 rounded bg-surface border border-border flex items-center justify-center font-mono text-[10px] font-bold text-text-tertiary shrink-0" translate="no">
                    {getShortCode(lang.code)}
                  </span>
                  <span className="skiptranslate notranslate truncate" translate="no">{lang.name}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`skiptranslate notranslate relative ${className}`} ref={dropdownRef} translate="no">
        <button
          type="button"
          translate="no"
          onClick={() => setIsOpen(!isOpen)}
          className="skiptranslate notranslate flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface-raised hover:bg-surface text-text-secondary hover:text-text-primary text-xs font-semibold transition-all shadow-sm"
          title="Change website language"
        >
          <Globe className="w-3.5 h-3.5 text-accent" />
          <span className="skiptranslate notranslate font-medium" translate="no">{currentLanguage.name}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown menu - always mounted in DOM to prevent translation re-trigger */}
        <div
          className={`skiptranslate notranslate absolute bottom-full left-0 mb-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] bg-surface border border-border rounded-xl shadow-2xl p-2.5 z-50 transition-all duration-150 origin-bottom-left ${
            isOpen ? "opacity-100 visible pointer-events-auto scale-100" : "opacity-0 invisible pointer-events-none scale-95"
          }`}
          translate="no"
        >
          <div className="skiptranslate notranslate flex items-center justify-between pb-2 mb-2 border-b border-border text-[11px] font-bold text-text-tertiary uppercase tracking-wider px-1" translate="no">
            <span className="skiptranslate notranslate flex items-center gap-1.5 text-text-primary" translate="no">
              <Globe className="w-3.5 h-3.5 text-accent" /> Select Language
            </span>
            <span className="skiptranslate notranslate text-[10px] text-text-tertiary font-mono" translate="no">12 Languages</span>
          </div>

          <div className="p-2 border-b border-border/80 mb-1 skiptranslate notranslate" translate="no">
            <div className="skiptranslate notranslate flex items-center gap-2 bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs" translate="no">
              <Search className="w-3.5 h-3.5 text-text-tertiary" />
              <input
                ref={searchInputRef}
                type="text"
                translate="no"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search language or country..."
                className="skiptranslate notranslate bg-transparent border-none outline-none text-text-primary placeholder:text-text-tertiary w-full text-xs"
              />
            </div>
          </div>

          <div className="skiptranslate notranslate max-h-64 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar" translate="no">
            {filteredLanguages.map((lang) => {
              const isSelected = currentLanguage.code === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  translate="no"
                  onClick={() => handleSelect(lang.code)}
                  className={`skiptranslate notranslate flex items-center justify-between p-2 rounded-lg text-xs transition-colors text-left ${
                    isSelected
                      ? "bg-accent/15 text-accent font-bold"
                      : "hover:bg-surface-raised text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <div className="skiptranslate notranslate flex items-center gap-2.5" translate="no">
                    <span className="skiptranslate notranslate w-6 h-5 rounded bg-surface-raised border border-border flex items-center justify-center font-mono text-[10px] font-bold text-text-secondary shrink-0" translate="no">
                      {getShortCode(lang.code)}
                    </span>
                    <div className="skiptranslate notranslate flex flex-col" translate="no">
                      <span className="skiptranslate notranslate font-semibold text-text-primary" translate="no">
                        {lang.name} {lang.nativeName !== lang.name && `(${lang.nativeName})`}
                      </span>
                      <span className="skiptranslate notranslate text-[10px] text-text-tertiary" translate="no">
                        {lang.region}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-accent shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Default: Compact Header Dropdown (e.g. 🌐 EN ▾)
  return (
    <div className={`skiptranslate notranslate relative ${className}`} ref={dropdownRef} translate="no">
      <button
        type="button"
        translate="no"
        onClick={() => setIsOpen(!isOpen)}
        className="skiptranslate notranslate flex items-center gap-1.5 sm:gap-2 h-8.5 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-text-secondary bg-surface hover:bg-surface-raised border border-border hover:border-border-hover rounded-lg sm:rounded-xl transition-all shadow-sm group shrink-0"
        title={`Change Language (Current: ${currentLanguage.name})`}
        aria-label="Language Selector"
      >
        <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent group-hover:rotate-12 transition-transform shrink-0" />
        <span className="skiptranslate notranslate font-semibold text-xs sm:text-sm text-text-primary" translate="no">
          {getShortCode(currentLanguage.code)}
        </span>
        <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-text-tertiary group-hover:text-text-primary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Popup - Always mounted with CSS visibility to prevent Google Translate dynamic re-translation */}
      <div
        className={`skiptranslate notranslate absolute top-full right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] bg-surface border border-border rounded-xl shadow-2xl p-2.5 z-50 transition-all duration-150 origin-top-right ${
          isOpen ? "opacity-100 visible pointer-events-auto scale-100" : "opacity-0 invisible pointer-events-none scale-95"
        }`}
        translate="no"
      >
        {/* Header & Search */}
        <div className="skiptranslate notranslate flex items-center justify-between pb-2 mb-2 border-b border-border text-[11px] font-bold text-text-tertiary uppercase tracking-wider px-1" translate="no">
          <span className="skiptranslate notranslate flex items-center gap-1.5 text-text-primary" translate="no">
            <Globe className="w-3.5 h-3.5 text-accent" /> Select Language
          </span>
          <span className="skiptranslate notranslate text-[10px] text-text-tertiary font-mono" translate="no">12 Languages</span>
        </div>

        <div className="mb-2 skiptranslate notranslate" translate="no">
          <div className="skiptranslate notranslate flex items-center gap-2 bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs focus-within:border-accent" translate="no">
            <Search className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              translate="no"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search language or country..."
              className="skiptranslate notranslate bg-transparent border-none outline-none text-text-primary placeholder:text-text-tertiary w-full text-xs"
            />
          </div>
        </div>

        {/* Languages List */}
        <div className="skiptranslate notranslate max-h-72 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar" translate="no">
          {filteredLanguages.length === 0 ? (
            <div className="skiptranslate notranslate py-4 text-center text-xs text-text-tertiary" translate="no">
              No matching languages found
            </div>
          ) : (
            filteredLanguages.map((lang) => {
              const isSelected = currentLanguage.code === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  translate="no"
                  onClick={() => handleSelect(lang.code)}
                  className={`skiptranslate notranslate w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors text-left ${
                    isSelected
                      ? "bg-accent/15 text-accent font-bold"
                      : "hover:bg-surface-raised text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <div className="skiptranslate notranslate flex items-center gap-2.5" translate="no">
                    <span className="skiptranslate notranslate w-6 h-5 rounded bg-surface-raised border border-border flex items-center justify-center font-mono text-[10px] font-bold text-text-secondary shrink-0" translate="no">
                      {getShortCode(lang.code)}
                    </span>
                    <div className="skiptranslate notranslate flex flex-col" translate="no">
                      <span className="skiptranslate notranslate font-semibold text-text-primary text-xs" translate="no">
                        {lang.name} {lang.nativeName !== lang.name && <span className="skiptranslate notranslate text-text-secondary font-normal text-[11px]" translate="no">({lang.nativeName})</span>}
                      </span>
                      <span className="skiptranslate notranslate text-[10px] text-text-tertiary" translate="no">
                        {lang.region}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-accent shrink-0 ml-2" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

