import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const length: number = Math.max(4, Math.min(512, body.length || 32));
    const format: "alphanumeric" | "hex" | "base64" | "numeric" | "uuid" = body.format || "alphanumeric";
    const count: number = Math.max(1, Math.min(50, body.count || 1));

    const results: string[] = [];

    for (let c = 0; c < count; c++) {
      let str = "";
      if (format === "hex") {
        str = crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
      } else if (format === "numeric") {
        for (let i = 0; i < length; i++) {
          str += crypto.randomInt(0, 10).toString();
        }
      } else if (format === "base64") {
        str = crypto.randomBytes(Math.ceil((length * 3) / 4)).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, length);
      } else if (format === "uuid") {
        str = crypto.randomUUID();
      } else {
        // Alphanumeric
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < length; i++) {
          str += chars[crypto.randomInt(0, chars.length)];
        }
      }
      results.push(str);
    }

    const entropy = Math.round(length * (format === "hex" ? 4 : format === "numeric" ? 3.32 : 5.95));

    return NextResponse.json({
      success: true,
      data: {
        token: results[0],
        tokensList: results,
        format,
        length,
        entropy,
        securityLevel: "CSPRNG (Cryptographically Secure Pseudo-Random Number Generator)",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate secure random string" },
      { status: 500 }
    );
  }
}
