export interface WordCounterOutput {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
  avgWordsPerSentence: number;
  avgCharPerWord: number;
  topWords: Array<{ word: string; count: number; frequency: number }>;
}

export function analyzeText(text: string): WordCounterOutput {
  if (!text || !text.trim()) {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      lines: 0,
      readingTimeMinutes: 0,
      speakingTimeMinutes: 0,
      avgWordsPerSentence: 0,
      avgCharPerWord: 0,
      topWords: [],
    };
  }

  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s+/g, "").length;

  const wordsArray = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const words = wordsArray.length;

  const sentencesArray = text
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0);
  const sentences = sentencesArray.length || (words > 0 ? 1 : 0);

  const paragraphsArray = text
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0);
  const paragraphs = paragraphsArray.length || (words > 0 ? 1 : 0);

  const lines = text.split("\n").length;

  const readingTimeMinutes = Math.ceil(words / 200);
  const speakingTimeMinutes = Math.ceil(words / 130);

  const avgWordsPerSentence = sentences > 0 ? parseFloat((words / sentences).toFixed(1)) : 0;
  const avgCharPerWord = words > 0 ? parseFloat((charactersNoSpaces / words).toFixed(1)) : 0;

  // Stopwords list to exclude
  const stopwords = new Set(["the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "is", "or", "an", "are"]);

  const frequencyMap: Record<string, number> = {};
  wordsArray.forEach((w) => {
    const cleanWord = w.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanWord.length > 2 && !stopwords.has(cleanWord)) {
      frequencyMap[cleanWord] = (frequencyMap[cleanWord] || 0) + 1;
    }
  });

  const topWords = Object.entries(frequencyMap)
    .map(([word, count]) => ({
      word,
      count,
      frequency: parseFloat(((count / words) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    lines,
    readingTimeMinutes,
    speakingTimeMinutes,
    avgWordsPerSentence,
    avgCharPerWord,
    topWords,
  };
}
