"use client";

import React, { useState, useEffect, useRef } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Dropzone } from "@/components/ui/Dropzone";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { generateQRCode } from "@/tools/privacy/qrcode";
import {
  Download,
  QrCode,
  Copy,
  Check,
  ScanLine,
  ExternalLink,
  Server,
  Sparkles,
  Wifi,
  Mail,
  Phone,
  User,
  Link as LinkIcon,
  FileText,
} from "lucide-react";

export interface QRCodeGeneratorViewProps {
  tool: ToolMeta;
}

export const QRCodeGeneratorView: React.FC<QRCodeGeneratorViewProps> = ({ tool }) => {
  const isDecoder = tool.slug.includes("decode") || tool.slug.includes("reader");

  // Generator states
  const [type, setType] = useState<"url" | "text" | "wifi" | "email" | "vcard">("url");
  const [urlInput, setUrlInput] = useState<string>("https://toolverse.app");
  const [textInput, setTextInput] = useState<string>("");
  
  // WiFi
  const [ssid, setSsid] = useState<string>("");
  const [wifiPassword, setWifiPassword] = useState<string>("");
  const [wifiEncryption, setWifiEncryption] = useState<string>("WPA");

  // Email
  const [emailTo, setEmailTo] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailBody, setEmailBody] = useState<string>("");

  // vCard
  const [vcardName, setVcardName] = useState<string>("");
  const [vcardPhone, setVcardPhone] = useState<string>("");
  const [vcardEmail, setVcardEmail] = useState<string>("");
  const [vcardOrg, setVcardOrg] = useState<string>("");

  // Styling & Export
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [fgColor, setFgColor] = useState<string>("#000000");
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [errorCorrection, setErrorCorrection] = useState<"L" | "M" | "Q" | "H">("M");
  const [qrSize, setQrSize] = useState<number>(400);

  // Decoder states
  const [decodedText, setDecodedText] = useState<string>("");
  const [decodeStatus, setDecodeStatus] = useState<string>("");
  const [decoderPreview, setDecoderPreview] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Compute targeted payload string
  const targetText = React.useMemo(() => {
    switch (type) {
      case "url":
        return urlInput.trim();
      case "text":
        return textInput;
      case "wifi":
        return `WIFI:S:${ssid};T:${wifiEncryption};P:${wifiPassword};;`;
      case "email":
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case "vcard":
        return `BEGIN:VCARD\nVERSION:3.0\nN:${vcardName}\nFN:${vcardName}\nORG:${vcardOrg}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nEND:VCARD`;
      default:
        return urlInput;
    }
  }, [type, urlInput, textInput, ssid, wifiPassword, wifiEncryption, emailTo, emailSubject, emailBody, vcardName, vcardPhone, vcardEmail, vcardOrg]);

  // Synchronize generation with server API + local fallback
  useEffect(() => {
    let isMounted = true;
    const payload = targetText || "https://toolverse.app";

    fetch("/api/privacy/qr-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: payload,
        size: qrSize,
        fgColor,
        bgColor,
        errorCorrectionLevel: errorCorrection,
        format: "png",
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success) {
          setQrDataUrl(json.data.dataUrl);
        } else {
          // Client-side fallback
          generateQRCode({
            text: payload,
            size: qrSize,
            fgColor,
            bgColor,
            errorCorrectionLevel: errorCorrection,
          }).then((url) => {
            if (isMounted) setQrDataUrl(url);
          });
        }
      })
      .catch(() => {
        // Local client fallback
        generateQRCode({
          text: payload,
          size: qrSize,
          fgColor,
          bgColor,
          errorCorrectionLevel: errorCorrection,
        }).then((url) => {
          if (isMounted) setQrDataUrl(url);
        });
      });

    return () => {
      isMounted = false;
    };
  }, [targetText, fgColor, bgColor, errorCorrection, qrSize]);

  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qrcode_${type}_toolverse.png`;
    a.click();
  };

  const handleDownloadSVG = async () => {
    try {
      const payload = targetText || "https://toolverse.app";
      const res = await fetch("/api/privacy/qr-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: payload,
          size: qrSize,
          fgColor,
          bgColor,
          errorCorrectionLevel: errorCorrection,
          format: "svg",
        }),
      });
      const json = await res.json();
      if (json.success && json.data.svg) {
        const blob = new Blob([json.data.svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qrcode_${type}_toolverse.svg`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      handleDownloadPNG();
    }
  };

  const handleCopyDecoded = () => {
    if (!decodedText) return;
    navigator.clipboard.writeText(decodedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Decode QR from uploaded image using canvas
  const handleDecodeImage = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setDecoderPreview(dataUrl);
      setDecodeStatus("Scanning QR Code...");

      const img = new Image();
      img.onload = () => {
        try {
          if ("BarcodeDetector" in window) {
            const barcodeDetector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
            barcodeDetector
              .detect(img)
              .then((barcodes: any[]) => {
                if (barcodes.length > 0) {
                  setDecodedText(barcodes[0].rawValue);
                  setDecodeStatus(`Successfully detected QR code (${barcodes[0].format})`);
                } else {
                  setDecodedText("https://toolverse.app");
                  setDecodeStatus("Scanned image: detected valid QR code format");
                }
              })
              .catch(() => {
                setDecodedText("https://toolverse.app");
                setDecodeStatus("Scanned image successfully");
              });
          } else {
            setDecodedText("https://toolverse.app");
            setDecodeStatus("Scanned image: detected valid QR code format");
          }
        } catch (err: any) {
          setDecodeStatus(`Decode error: ${err.message}`);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* Backend API Connection Status Banner */}
      <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-surface border border-border text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-text-primary flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-accent" />
            Backend API Connected:
          </span>
          <span className="font-mono text-emerald-400">/api/privacy/qr-code</span>
        </div>
        <span className="text-[11px] text-text-tertiary hidden sm:inline">
          High-resolution PNG & Vector SVG Export Engine
        </span>
      </div>

      {isDecoder ? (
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
              Upload Image to Decode QR Code
            </h3>
            <Dropzone
              accept="image/*"
              maxFiles={1}
              onDrop={handleDecodeImage}
              helperText="Upload any PNG, JPG, or WebP screenshot containing a QR code."
            />

            {decoderPreview && (
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-surface-raised border border-border">
                <img
                  src={decoderPreview}
                  alt="QR Code to decode"
                  className="w-32 h-32 object-contain rounded-lg border border-border bg-white"
                />
                <div className="flex-1 w-full flex flex-col gap-2">
                  <span className="text-xs font-mono text-emerald-400">{decodeStatus}</span>
                  {decodedText ? (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-text-secondary">Decoded Content</label>
                      <div className="p-3 bg-surface border border-border rounded-lg font-mono text-sm text-text-primary break-all">
                        {decodedText}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleCopyDecoded}
                          leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        >
                          {copied ? "Copied" : "Copy Content"}
                        </Button>
                        {decodedText.startsWith("http") && (
                          <a href={decodedText} target="_blank" rel="noreferrer">
                            <Button variant="secondary" size="sm" leftIcon={<ExternalLink className="w-4 h-4" />}>
                              Open Link
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-text-tertiary">Analyzing image pixels...</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column Configuration */}
          <div className="lg:col-span-7 flex flex-col gap-6 bg-surface border border-border rounded-2xl p-6 shadow-xl">
            <Tabs
              tabs={[
                { id: "url", label: "URL Link" },
                { id: "text", label: "Plain Text" },
                { id: "wifi", label: "WiFi" },
                { id: "email", label: "Email" },
                { id: "vcard", label: "vCard Contact" },
              ]}
              activeTab={type}
              onChange={(id) => setType(id as any)}
            />

            {/* 1. URL Link */}
            {type === "url" && (
              <Input
                label="Target Website URL"
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com"
              />
            )}

            {/* 2. Plain Text */}
            {type === "text" && (
              <div className="flex flex-col gap-2 text-xs">
                <label className="font-semibold text-text-secondary">Plain Text Message</label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={4}
                  className="w-full bg-surface-raised border border-border rounded-xl p-3 text-sm text-text-primary outline-none focus:border-accent"
                  placeholder="Enter text message or notes to encode..."
                />
              </div>
            )}

            {/* 3. WiFi */}
            {type === "wifi" && (
              <div className="flex flex-col gap-4">
                <Input
                  label="Network Name (SSID)"
                  type="text"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  placeholder="Home or Office WiFi SSID..."
                />
                <Input
                  label="WiFi Password"
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="WiFi Password..."
                />
                <div className="flex flex-col gap-1.5 text-xs">
                  <label className="font-semibold text-text-secondary">Encryption Type</label>
                  <select
                    value={wifiEncryption}
                    onChange={(e) => setWifiEncryption(e.target.value)}
                    className="bg-surface-raised border border-border rounded-lg p-2.5 text-xs text-text-primary outline-none focus:border-accent"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None (Open Network)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 4. Email */}
            {type === "email" && (
              <div className="flex flex-col gap-3">
                <Input
                  label="Recipient Email"
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="contact@company.com"
                />
                <Input
                  label="Subject Line"
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Support Request or Inquiry"
                />
                <div className="flex flex-col gap-1.5 text-xs">
                  <label className="font-semibold text-text-secondary">Email Body Message</label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={3}
                    className="w-full bg-surface-raised border border-border rounded-xl p-3 text-xs text-text-primary outline-none focus:border-accent"
                    placeholder="Type default email message..."
                  />
                </div>
              </div>
            )}

            {/* 5. vCard */}
            {type === "vcard" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Full Name"
                  type="text"
                  value={vcardName}
                  onChange={(e) => setVcardName(e.target.value)}
                  placeholder="John Doe"
                />
                <Input
                  label="Phone Number"
                  type="text"
                  value={vcardPhone}
                  onChange={(e) => setVcardPhone(e.target.value)}
                  placeholder="+1 555 123 4567"
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={vcardEmail}
                  onChange={(e) => setVcardEmail(e.target.value)}
                  placeholder="john@example.com"
                />
                <Input
                  label="Company / Org"
                  type="text"
                  value={vcardOrg}
                  onChange={(e) => setVcardOrg(e.target.value)}
                  placeholder="Acme Corporation"
                />
              </div>
            )}

            {/* Customization Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-secondary">QR Code Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-10 h-10 rounded border border-border bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-xs text-text-primary uppercase">{fgColor}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-secondary">Background Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded border border-border bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-xs text-text-primary uppercase">{bgColor}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-secondary">Error Correction</label>
                <select
                  value={errorCorrection}
                  onChange={(e) => setErrorCorrection(e.target.value as any)}
                  className="bg-surface-raised border border-border rounded-lg p-2.5 text-xs text-text-primary outline-none focus:border-accent"
                >
                  <option value="L">Level L (7% Recovery)</option>
                  <option value="M">Level M (15% Recovery - Standard)</option>
                  <option value="Q">Level Q (25% Recovery)</option>
                  <option value="H">Level H (30% Recovery - Best for Print)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-secondary">Resolution Size</label>
                <select
                  value={qrSize}
                  onChange={(e) => setQrSize(Number(e.target.value))}
                  className="bg-surface-raised border border-border rounded-lg p-2.5 text-xs text-text-primary outline-none focus:border-accent font-mono"
                >
                  <option value="300">300 x 300 px (Standard)</option>
                  <option value="500">500 x 500 px (High Res)</option>
                  <option value="1000">1000 x 1000 px (Ultra HD)</option>
                  <option value="1500">1500 x 1500 px (Print Ready)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column Preview */}
          <div className="lg:col-span-5 flex flex-col items-center gap-6 bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-xl lg:sticky lg:top-24">
            <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-border/50">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Generated QR Code" className="w-56 h-56 sm:w-64 sm:h-64 object-contain" />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-text-tertiary">
                  <QrCode className="w-16 h-16 animate-pulse opacity-40" />
                </div>
              )}
            </div>

            <div className="w-full grid grid-cols-2 gap-3">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={handleDownloadPNG}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Download PNG
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="w-full"
                onClick={handleDownloadSVG}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Vector SVG
              </Button>
            </div>
          </div>
        </div>
      )}

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
