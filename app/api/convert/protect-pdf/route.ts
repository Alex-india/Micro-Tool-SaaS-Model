import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const password = formData.get("password") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    if (!password || password.trim() === "") {
      return NextResponse.json({ error: "Password is required to protect PDF" }, { status: 400 });
    }

    const pythonEndpoint = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";

    const pythonFormData = new FormData();
    pythonFormData.append("file", file);
    pythonFormData.append("password", password);

    const response = await fetch(`${pythonEndpoint}/api/convert/protect-pdf`, {
      method: "POST",
      body: pythonFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `PDF Protection failed: ${errorText}` },
        { status: response.status }
      );
    }

    const protectedPdfBlob = await response.arrayBuffer();
    const filename = file.name.replace(/\.[^/.]+$/, "") + "_protected.pdf";

    return new NextResponse(protectedPdfBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process Protect PDF request" },
      { status: 500 }
    );
  }
}
