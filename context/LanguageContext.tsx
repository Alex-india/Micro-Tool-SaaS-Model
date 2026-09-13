"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface LanguageMeta {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
  dir?: "ltr" | "rtl";
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    region: "United States / UK / Global",
    dir: "ltr",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    region: "Germany / Switzerland / Austria",
    dir: "ltr",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    region: "France / Canada / Belgium",
    dir: "ltr",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    region: "Spain / Latin America",
    dir: "ltr",
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    region: "Japan",
    dir: "ltr",
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "🇧🇷",
    region: "Brazil / Portugal",
    dir: "ltr",
  },
  {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
    region: "Italy / Switzerland",
    dir: "ltr",
  },
  {
    code: "nl",
    name: "Dutch",
    nativeName: "Nederlands",
    flag: "🇳🇱",
    region: "Netherlands / Belgium",
    dir: "ltr",
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    region: "UAE / Saudi Arabia / Middle East",
    dir: "rtl",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    region: "India",
    dir: "ltr",
  },
  {
    code: "zh-CN",
    name: "Chinese",
    nativeName: "中文 (简体)",
    flag: "🇨🇳",
    region: "China / Singapore",
    dir: "ltr",
  },
  {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    flag: "🇷🇺",
    region: "Eastern Europe",
    dir: "ltr",
  },
];

interface LanguageContextType {
  currentLanguage: LanguageMeta;
  supportedLanguages: LanguageMeta[];
  changeLanguage: (code: string) => void;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: SUPPORTED_LANGUAGES[0],
  supportedLanguages: SUPPORTED_LANGUAGES,
  changeLanguage: () => {},
  isTranslating: false,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLang] = useState<LanguageMeta>(SUPPORTED_LANGUAGES[0]);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Set translation cookie helper across all host/domain formats
  const setTranslationCookie = (langCode: string) => {
    if (typeof document === "undefined") return;
    const cookieVal = `/en/${langCode}`;
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    
    // 1. Root path cookie (works on localhost, IPs, and all subpaths)
    document.cookie = `googtrans=${cookieVal}; expires=${expires}; path=/;`;

    // 2. Domain & subdomains (if applicable on production domains)
    if (window.location.hostname && window.location.hostname !== "localhost") {
      document.cookie = `googtrans=${cookieVal}; expires=${expires}; path=/; domain=${window.location.hostname};`;
      const parts = window.location.hostname.split(".");
      if (parts.length >= 2) {
        const rootDomain = "." + parts.slice(-2).join(".");
        document.cookie = `googtrans=${cookieVal}; expires=${expires}; path=/; domain=${rootDomain};`;
      }
    }
  };

  // Clear translation cookie to restore native English
  const clearTranslationCookie = () => {
    if (typeof document === "undefined") return;
    const past = "Thu, 01 Jan 1970 00:00:00 UTC";
    document.cookie = `googtrans=; expires=${past}; path=/;`;
    if (window.location.hostname) {
      document.cookie = `googtrans=; expires=${past}; path=/; domain=${window.location.hostname};`;
      document.cookie = `googtrans=; expires=${past}; path=/; domain=.${window.location.hostname};`;
      const parts = window.location.hostname.split(".");
      if (parts.length >= 2) {
        const rootDomain = "." + parts.slice(-2).join(".");
        document.cookie = `googtrans=; expires=${past}; path=/; domain=${rootDomain};`;
        document.cookie = `googtrans=; expires=${past}; path=/; domain=.${rootDomain};`;
      }
    }
  };

  // 1. Anti-Popup MutationObserver Guard: Suppress any Google popups, tooltips, or banners
  useEffect(() => {
    if (typeof window === "undefined") return;

    const suppressPopups = () => {
      // Keep body position clean
      if (document.body.style.top && document.body.style.top !== "0px") {
        document.body.style.top = "0px";
      }

      // Remove / hide tooltip balloons
      const tooltip = document.getElementById("goog-gt-tt");
      if (tooltip) {
        tooltip.style.display = "none";
        tooltip.style.visibility = "hidden";
        tooltip.style.opacity = "0";
      }

      // Hide all Google banner frames
      const banners = document.querySelectorAll(".goog-te-banner-frame, iframe.goog-te-banner-frame, iframe.skiptranslate");
      banners.forEach((b) => {
        (b as HTMLElement).style.display = "none";
        (b as HTMLElement).style.visibility = "hidden";
      });

      // Hide any modern Google popups
      const modernPopups = document.querySelectorAll('[class*="VIpgJd"]');
      modernPopups.forEach((el) => {
        if (el && !el.closest("#google_translate_element")) {
          (el as HTMLElement).style.display = "none";
          (el as HTMLElement).style.visibility = "hidden";
        }
      });
    };

    const observer = new MutationObserver(() => {
      suppressPopups();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    suppressPopups();

    return () => observer.disconnect();
  }, []);

  // 2. Initialize Language & Google Translate Script
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check saved language from localStorage
    const savedLangCode = localStorage.getItem("toolverse_language") || "en";
    const activeMeta = SUPPORTED_LANGUAGES.find((l) => l.code === savedLangCode) || SUPPORTED_LANGUAGES[0];

    setCurrentLang(activeMeta);
    if (activeMeta.dir) {
      document.documentElement.dir = activeMeta.dir;
    }
    document.documentElement.lang = activeMeta.code;

    // Sync cookie
    if (activeMeta.code !== "en") {
      setTranslationCookie(activeMeta.code);
    } else {
      clearTranslationCookie();
    }

    // Callback for Google Translate
    window.googleTranslateElementInit = () => {
      try {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: "en,de,fr,es,ja,pt,it,nl,ar,hi,zh-CN,ru",
              autoDisplay: false,
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            },
            "google_translate_element"
          );
        }
      } catch (err) {
        console.warn("Google Translate initialization notice:", err);
      }
    };

    // Load Google Translate script dynamically if not already added
    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.type = "text/javascript";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // 3. Change Language Handler
  const changeLanguage = useCallback((code: string) => {
    const targetMeta = SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
    
    setIsTranslating(true);
    setCurrentLang(targetMeta);
    localStorage.setItem("toolverse_language", targetMeta.code);

    if (typeof document !== "undefined") {
      document.documentElement.lang = targetMeta.code;
      document.documentElement.dir = targetMeta.dir || "ltr";
    }

    if (targetMeta.code === "en") {
      clearTranslationCookie();
    } else {
      setTranslationCookie(targetMeta.code);
    }

    // Trigger clean reload so Next.js components render and translate smoothly without React hydration errors or Google popup
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }, 80);
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage: currentLang,
        supportedLanguages: SUPPORTED_LANGUAGES,
        changeLanguage,
        isTranslating,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

