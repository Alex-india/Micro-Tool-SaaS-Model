import QRCode from "qrcode";

export interface QRCodeConfig {
  text: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

export async function generateQRCode(config: QRCodeConfig): Promise<string> {
  const { text, size = 300, fgColor = "#000000", bgColor = "#ffffff", errorCorrectionLevel = "M" } = config;

  if (!text || !text.trim()) return "";

  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel,
    });
    return dataUrl;
  } catch (err) {
    console.error("QR Code Generation Error:", err);
    return "";
  }
}
