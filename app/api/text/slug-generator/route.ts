import { NextRequest, NextResponse } from "next/server";
import { generateSlug, analyzeSlugSEO, SlugOptions, DEFAULT_SLUG_OPTIONS } from "@/tools/text/slugGenerator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string = body.text || "";
    const bulkTexts: string[] = Array.isArray(body.bulkTexts) ? body.bulkTexts : [];
    const options: SlugOptions = {
      ...DEFAULT_SLUG_OPTIONS,
      ...(body.options || {}),
    };

    if (bulkTexts.length > 0) {
      const results = bulkTexts.map((title) => ({
        original: title,
        slug: generateSlug(title, options),
        seo: analyzeSlugSEO(generateSlug(title, options)),
      }));

      return NextResponse.json({
        success: true,
        data: {
          mode: "bulk",
          count: results.length,
          results,
        },
      });
    }

    const slug = generateSlug(text, options);
    const seo = analyzeSlugSEO(slug);

    return NextResponse.json({
      success: true,
      data: {
        mode: "single",
        slug,
        seo,
        options,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate slug" },
      { status: 500 }
    );
  }
}
