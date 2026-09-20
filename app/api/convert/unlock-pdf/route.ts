import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const password = (formData.get("password") as string | null) || "";

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    const pythonEndpoint = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";

    const pythonFormData = new FormData();
    pythonFormData.append("file", file);
    pythonFormData.append("password", password);

    const response = await fetch(`${pythonEndpoint}/api/convert/unlock-pdf`, {
      method: "POST",
      body: pythonFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `PDF Unlock failed: ${errorText}` },
        { status: response.status }
      );
    }

    const unlockedPdfBlob = await response.arrayBuffer();
    const filename = file.name.replace(/\.[^/.]+$/, "") + "_unlocked.pdf";

    return new NextResponse(unlockedPdfBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process Unlock PDF request" },
      { status: 500 }
    );
  }
}
