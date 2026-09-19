import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string = body.text !== undefined ? body.text : "";
    const algorithm: string = (body.algorithm || "sha256").toLowerCase();
    const hmacKey: string = body.hmacKey || "";
    const compareWith: string = body.compareWith || "";

    const supportedAlgorithms = ["sha256", "sha512", "sha384", "sha1", "md5", "ripemd160"];
    const algoToUse = supportedAlgorithms.includes(algorithm) ? algorithm : "sha256";

    let hash = "";
    if (hmacKey) {
      hash = crypto.createHmac(algoToUse, hmacKey).update(text).digest("hex");
    } else {
      hash = crypto.createHash(algoToUse).update(text).digest("hex");
    }

    // Generate full hash suite for convenience
    const allHashes: Record<string, string> = {
      md5: crypto.createHash("md5").update(text).digest("hex"),
      sha1: crypto.createHash("sha1").update(text).digest("hex"),
      sha256: crypto.createHash("sha256").update(text).digest("hex"),
      sha384: crypto.createHash("sha384").update(text).digest("hex"),
      sha512: crypto.createHash("sha512").update(text).digest("hex"),
    };

    let isMatch: boolean | null = null;
    if (compareWith) {
      isMatch = hash.toLowerCase() === compareWith.trim().toLowerCase();
    }

    return NextResponse.json({
      success: true,
      data: {
        algorithm: algoToUse,
        hash,
        allHashes,
        isHmac: Boolean(hmacKey),
        isMatch,
        byteLength: Buffer.byteLength(text, "utf8"),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to compute hash" },
      { status: 500 }
    );
  }
}
