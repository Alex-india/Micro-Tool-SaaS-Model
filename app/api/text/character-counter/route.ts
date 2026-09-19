import { NextRequest, NextResponse } from "next/server";

interface PlatformLimit {
  id: string;
  name: string;
  limit: number;
  icon: string;
  category: "social" | "seo" | "messaging";
}

const PLATFORMS: PlatformLimit[] = [
  { id: "twitter", name: "Twitter / X Post", limit: 280, icon: "𝕏", category: "social" },
  { id: "threads", name: "Threads Post", limit: 500, icon: "🧵", category: "social" },
  { id: "sms", name: "SMS Segment", limit: 160, icon: "💬", category: "messaging" },
  { id: "instagram_bio", name: "Instagram Bio", limit: 150, icon: "📸", category: "social" },
  { id: "instagram_caption", name: "Instagram Caption", limit: 2200, icon: "📸", category: "social" },
  { id: "seo_title", name: "Google SEO Title", limit: 60, icon: "🔍", category: "seo" },
  { id: "seo_desc", name: "Google Meta Description", limit: 160, icon: "📝", category: "seo" },
  { id: "linkedin_post", name: "LinkedIn Post", limit: 3000, icon: "💼", category: "social" },
  { id: "linkedin_headline", name: "LinkedIn Headline", limit: 220, icon: "💼", category: "social" },
  { id: "youtube_title", name: "YouTube Video Title", limit: 100, icon: "▶️", category: "social" },
  { id: "youtube_desc", name: "YouTube Description", limit: 5000, icon: "▶️", category: "social" },
  { id: "tiktok_caption", name: "TikTok Caption", limit: 2200, icon: "🎵", category: "social" },
  { id: "pinterest_title", name: "Pinterest Title", limit: 100, icon: "📌", category: "social" },
  { id: "reddit_title", name: "Reddit Post Title", limit: 300, icon: "🤖", category: "social" },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const raw: string = body.text || "";

    const charsWithSpaces = raw.length;
    const charsNoSpaces = raw.replace(/\s/g, "").length;
    const words = raw.trim() === "" ? 0 : raw.trim().split(/\s+/).length;
    const sentences = raw.trim() === "" ? 0 : (raw.match(/[^.!?]+[.!?]+(\s|$)/g) || [1]).length;
    const lines = raw === "" ? 0 : raw.split("\n").length;
    const paragraphs = raw.split(/\n+/).filter((p) => p.trim().length > 0).length;

    // Detailed Character breakdown
    const letters = (raw.match(/[a-zA-Z]/g) || []).length;
    const uppercaseLetters = (raw.match(/[A-Z]/g) || []).length;
    const lowercaseLetters = (raw.match(/[a-z]/g) || []).length;
    const digits = (raw.match(/[0-9]/g) || []).length;
    const spaces = (raw.match(/[\s]/g) || []).length;
    const vowels = (raw.match(/[aeiouAEIOU]/g) || []).length;
    const consonants = (raw.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || []).length;
    const punctuation = (raw.match(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'\[\]]/g) || []).length;
    const specials = charsWithSpaces - letters - digits - spaces;
    const emojis = (raw.match(/\p{Extended_Pictographic}/gu) || []).length;

    // Platform analysis
    const platformStatus = PLATFORMS.map((p) => {
      const current = charsWithSpaces;
      const limit = p.limit;
      const percentage = Math.min(100, Math.round((current / limit) * 100));
      const isOver = current > limit;
      const remaining = limit - current;
      const smsSegments = p.id === "sms" ? Math.ceil(Math.max(1, current) / 160) : undefined;

      return {
        ...p,
        current,
        percentage,
        isOver,
        remaining,
        smsSegments,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        charsWithSpaces,
        charsNoSpaces,
        words,
        sentences,
        lines,
        paragraphs,
        letters,
        uppercaseLetters,
        lowercaseLetters,
        digits,
        spaces,
        vowels,
        consonants,
        punctuation,
        specials,
        emojis,
        platformStatus,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to analyze characters" },
      { status: 500 }
    );
  }
}
