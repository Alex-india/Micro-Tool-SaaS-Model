import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const originalText: string = body.originalText || "";
    const modifiedText: string = body.modifiedText || "";

    const origLines = originalText.split("\n");
    const modLines = modifiedText.split("\n");
    const maxLen = Math.max(origLines.length, modLines.length);

    let additions = 0;
    let deletions = 0;
    let modifications = 0;
    let identical = 0;

    const diff: {
      type: "same" | "add" | "remove" | "change";
      lineNumber: number;
      orig?: string;
      mod?: string;
    }[] = [];

    for (let i = 0; i < maxLen; i++) {
      const o = origLines[i];
      const m = modLines[i];

      if (o === m) {
        diff.push({ type: "same", lineNumber: i + 1, orig: o, mod: m });
        identical++;
      } else if (o === undefined) {
        diff.push({ type: "add", lineNumber: i + 1, mod: m });
        additions++;
      } else if (m === undefined) {
        diff.push({ type: "remove", lineNumber: i + 1, orig: o });
        deletions++;
      } else {
        diff.push({ type: "change", lineNumber: i + 1, orig: o, mod: m });
        modifications++;
      }
    }

    // Similarity score estimate
    const totalLines = Math.max(1, maxLen);
    const similarityPercentage = Math.round((identical / totalLines) * 100);

    return NextResponse.json({
      success: true,
      data: {
        diff,
        stats: {
          totalCompared: maxLen,
          additions,
          deletions,
          modifications,
          identical,
          similarityPercentage,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to compute diff" },
      { status: 500 }
    );
  }
}
