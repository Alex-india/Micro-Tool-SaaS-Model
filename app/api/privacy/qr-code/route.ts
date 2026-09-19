import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string = body.text || "";
    const size: number = Math.max(100, Math.min(2000, body.size || 400));
    const fgColor: string = body.fgColor || "#000000";
    const bgColor: string = body.bgColor || "#ffffff";
    const errorCorrectionLevel: "L" | "M" | "Q" | "H" = body.errorCorrectionLevel || "M";
    const format: "png" | "svg" = body.format || "png";

    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: "Text payload is required" },
        { status: 400 }
      );
    }

    if (format === "svg") {
      const svgString = await QRCode.toString(text, {
        type: "svg",
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel,
      });

      return NextResponse.json({
        success: true,
        data: {
          format: "svg",
          svg: svgString,
          size,
          errorCorrectionLevel,
        },
      });
    }

    const dataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel,
    });

    return NextResponse.json({
      success: true,
      data: {
        format: "png",
        dataUrl,
        size,
        errorCorrectionLevel,
        byteLength: dataUrl.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
