import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string = body.text || "";

    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const wordsArray = text.trim() ? text.trim().split(/\s+/) : [];
    const words = wordsArray.length;
    const sentences = text.trim() ? (text.match(/[^.!?]+[.!?]+(\s|$)/g) || [1]).length : 0;
    const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0).length;
    const lines = text ? text.split("\n").length : 0;

    // Reading & Speaking times
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
    const speakingTimeMinutes = Math.max(1, Math.ceil(words / 130));

    // Averages
    const avgWordsPerSentence = sentences > 0 ? parseFloat((words / sentences).toFixed(1)) : 0;
    const avgCharPerWord = words > 0 ? parseFloat((charactersNoSpaces / words).toFixed(1)) : 0;

    // Flesch Reading Ease score estimate (206.835 - 1.015*(words/sentences) - 84.6*(syllables/words))
    let syllables = 0;
    for (const w of wordsArray) {
      const clean = w.toLowerCase().replace(/[^a-z]/g, "");
      if (!clean) continue;
      const matches = clean.match(/[aeiouy]{1,2}/g);
      syllables += matches ? Math.max(1, matches.length) : 1;
    }
    const fleschScore =
      words > 0 && sentences > 0
        ? Math.max(
            0,
            Math.min(
              100,
              Math.round(206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / Math.max(1, words)))
            )
          )
        : 100;

    let readingGrade = "Easy";
    if (fleschScore < 30) readingGrade = "Very Difficult (College Graduate)";
    else if (fleschScore < 50) readingGrade = "Difficult (College)";
    else if (fleschScore < 60) readingGrade = "Fairly Difficult (High School)";
    else if (fleschScore < 70) readingGrade = "Standard (8th-9th Grade)";
    else if (fleschScore < 80) readingGrade = "Fairly Easy (7th Grade)";
    else if (fleschScore < 90) readingGrade = "Easy (6th Grade)";
    else readingGrade = "Very Easy (5th Grade)";

    // Top Keywords Density
    const freqMap: Record<string, number> = {};
    for (const raw of wordsArray) {
      const clean = raw.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
      if (clean.length > 2) {
        freqMap[clean] = (freqMap[clean] || 0) + 1;
      }
    }

    const topWords = Object.entries(freqMap)
      .map(([word, count]) => ({
        word,
        count,
        frequency: words > 0 ? parseFloat(((count / words) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        characters,
        charactersNoSpaces,
        words,
        sentences,
        paragraphs,
        lines,
        readingTimeMinutes,
        speakingTimeMinutes,
        avgWordsPerSentence,
        avgCharPerWord,
        fleschScore,
        readingGrade,
        syllables,
        topWords,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to analyze text" },
      { status: 500 }
    );
  }
}
