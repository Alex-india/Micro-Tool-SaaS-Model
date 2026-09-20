import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No document file provided" }, { status: 400 });
    }

    const pythonEndpoint = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";

    const pythonFormData = new FormData();
    pythonFormData.append("file", file);

    const response = await fetch(`${pythonEndpoint}/api/convert/word-to-pdf`, {
      method: "POST",
      body: pythonFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Word to PDF conversion failed: ${errorText}` },
        { status: response.status }
      );
    }

    const pdfBlob = await response.arrayBuffer();
    const filename = file.name.replace(/\.[^/.]+$/, "") + ".pdf";

    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process Word to PDF conversion" },
      { status: 500 }
    );
  }
}
