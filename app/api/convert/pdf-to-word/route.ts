import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    const pythonEndpoint = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";

    const pythonFormData = new FormData();
    pythonFormData.append("file", file);

    const response = await fetch(`${pythonEndpoint}/api/convert/pdf-to-word`, {
      method: "POST",
      body: pythonFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Python conversion failed: ${errorText}` },
        { status: response.status }
      );
    }

    const docxBlob = await response.arrayBuffer();
    const filename = file.name.replace(/\.[^/.]+$/, "") + ".docx";

    return new NextResponse(docxBlob, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process PDF to Word conversion" },
      { status: 500 }
    );
  }
}
