import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string = body.text || "";
    const targetCase: string = body.targetCase || "all";

    const conversions = {
      uppercase: text.toUpperCase(),
      lowercase: text.toLowerCase(),
      titleCase: text.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()),
      sentenceCase: text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase()),
      camelCase: text
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
          index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/[\s-_]+/g, ""),
      pascalCase: text
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
        .replace(/[\s-_]+/g, ""),
      snakeCase: text
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_")
        .replace(/[^\w_]/g, ""),
      kebabCase: text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, ""),
      constantCase: text
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_")
        .replace(/[^\w_]/g, ""),
      dotCase: text
        .trim()
        .toLowerCase()
        .replace(/[\s-_]+/g, ".")
        .replace(/[^\w.]/g, ""),
      pathCase: text
        .trim()
        .toLowerCase()
        .replace(/[\s-_]+/g, "/")
        .replace(/[^\w\/]/g, ""),
      alternatingCase: text
        .split("")
        .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
        .join(""),
      inverseCase: text
        .split("")
        .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
        .join(""),
    };

    let result = text;
    if (targetCase !== "all" && (conversions as any)[targetCase]) {
      result = (conversions as any)[targetCase];
    }

    return NextResponse.json({
      success: true,
      data: {
        result,
        conversions,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to convert case" },
      { status: 500 }
    );
  }
}
