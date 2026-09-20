import os
import io
import uuid
import tempfile
import logging
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import fitz  # PyMuPDF
from pdf2docx import Converter
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
import pptx
from pptx.util import Inches as PptxInches, Pt as PptxPt
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE_TYPE
from pptx.dml.color import RGBColor as PptxRGBColor

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("pdf_service")

app = FastAPI(title="ToolVerse PDF Conversion Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = os.path.join(tempfile.gettempdir(), "toolverse_pdf_conversions")
os.makedirs(TEMP_DIR, exist_ok=True)


def cleanup_files(*paths: str):
    """Safely delete temporary files after response is sent."""
    for p in paths:
        if p and os.path.exists(p):
            try:
                os.remove(p)
            except Exception as e:
                logger.warning(f"Failed to remove temp file {p}: {e}")


def fallback_fitz_to_docx(pdf_path: str, docx_path: str):
    """
    Fallback converter using PyMuPDF (fitz) layout-aware text extraction
    and python-docx when pdf2docx encounters complex edge cases.
    """
    doc = fitz.open(pdf_path)
    word_doc = docx.Document()

    # Configure standard normal style
    normal_style = word_doc.styles['Normal']
    normal_font = normal_style.font
    normal_font.name = 'Calibri'
    normal_font.size = Pt(11)

    for page_idx, page in enumerate(doc):
        # 1. Extract tables first if available
        tables = []
        try:
            tab_finder = page.find_tables()
            if tab_finder and tab_finder.tables:
                tables = tab_finder.tables
        except Exception as te:
            logger.debug(f"Table detection note on page {page_idx+1}: {te}")

        if tables:
            for tab in tables:
                table_data = tab.extract()
                if table_data:
                    t = word_doc.add_table(rows=len(table_data), cols=len(table_data[0]))
                    t.style = 'Table Grid'
                    for r_idx, row in enumerate(table_data):
                        for c_idx, cell_value in enumerate(row):
                            t.cell(r_idx, c_idx).text = str(cell_value or "")

        # 2. Extract structured text blocks (page.get_text("dict"))
        text_dict = page.get_text("dict")
        blocks = text_dict.get("blocks", [])

        # Compute average font size on page to detect headings relatively
        font_sizes = []
        for b in blocks:
            if b.get("type") == 0:  # text block
                for line in b.get("lines", []):
                    for span in line.get("spans", []):
                        if span.get("text", "").strip():
                            font_sizes.append(span.get("size", 11))

        avg_font_size = sum(font_sizes) / len(font_sizes) if font_sizes else 11

        for b in blocks:
            if b.get("type") == 0:  # text block
                for line in b.get("lines", []):
                    line_text = ""
                    is_bold = False
                    is_italic = False
                    max_span_size = 11

                    p = word_doc.add_paragraph()
                    for span in line.get("spans", []):
                        stext = span.get("text", "")
                        if not stext:
                            continue
                        size = span.get("size", 11)
                        flags = span.get("flags", 0)  # bit 1: italic, bit 4: bold
                        span_bold = bool(flags & 2 ** 4) or "bold" in span.get("font", "").lower()
                        span_italic = bool(flags & 2 ** 1) or "italic" in span.get("font", "").lower()

                        run = p.add_run(stext)
                        run.font.size = Pt(min(max(size, 8), 32))
                        run.font.name = "Calibri"
                        if span_bold:
                            run.bold = True
                        if span_italic:
                            run.italic = True

                        if size > max_span_size:
                            max_span_size = size

                    # Check if line qualifies as a heading
                    if max_span_size > avg_font_size * 1.3:
                        p.style = word_doc.styles['Heading 1'] if max_span_size > avg_font_size * 1.6 else word_doc.styles['Heading 2']

        # Add page break between pages except for the last page
        if page_idx < len(doc) - 1:
            word_doc.add_page_break()

    doc.close()
    word_doc.save(docx_path)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ToolVerse PDF Service", "version": "1.0.0"}


@app.post("/api/convert/pdf-to-word")
async def convert_pdf_to_word(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    High-fidelity PDF to Word (.docx) conversion using pdf2docx
    with layout, tables, fonts, and styling preservation.
    """
    if not file.filename.lower().endswith(".pdf") and file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    session_id = uuid.uuid4().hex
    input_pdf_path = os.path.join(TEMP_DIR, f"{session_id}_input.pdf")
    output_docx_path = os.path.join(TEMP_DIR, f"{session_id}_output.docx")

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        with open(input_pdf_path, "wb") as f:
            f.write(content)

        logger.info(f"Converting PDF to Word: {file.filename} ({len(content)} bytes)")

        # Method 1: Primary high-fidelity converter (pdf2docx)
        conversion_success = False
        try:
            cv = Converter(input_pdf_path)
            cv.convert(output_docx_path, start=0, end=None)
            cv.close()
            if os.path.exists(output_docx_path) and os.path.getsize(output_docx_path) > 0:
                conversion_success = True
                logger.info(f"pdf2docx successfully converted {file.filename}")
        except Exception as e:
            logger.warning(f"pdf2docx conversion error: {e}. Falling back to PyMuPDF + python-docx...")

        # Method 2: Robust Fallback with PyMuPDF layout parser + python-docx
        if not conversion_success:
            fallback_fitz_to_docx(input_pdf_path, output_docx_path)
            logger.info(f"Fallback fitz_to_docx converted {file.filename}")

        if not os.path.exists(output_docx_path) or os.path.getsize(output_docx_path) == 0:
            raise HTTPException(status_code=500, detail="Failed to produce Word document.")

        out_name = f"{os.path.splitext(file.filename)[0]}.docx"
        background_tasks.add_task(cleanup_files, input_pdf_path, output_docx_path)

        return FileResponse(
            path=output_docx_path,
            filename=out_name,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

    except HTTPException:
        cleanup_files(input_pdf_path, output_docx_path)
        raise
    except Exception as e:
        logger.error(f"Error in PDF to Word: {e}", exc_info=True)
        cleanup_files(input_pdf_path, output_docx_path)
        raise HTTPException(status_code=500, detail=f"Conversion error: {str(e)}")


@app.post("/api/convert/pdf-to-ppt")
async def convert_pdf_to_ppt(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    High-fidelity PDF to PowerPoint (.pptx) conversion using PyMuPDF & python-pptx.
    Creates 16:9 widescreen presentation slides preserving page visuals and typography.
    """
    if not file.filename.lower().endswith(".pdf") and file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    session_id = uuid.uuid4().hex
    input_pdf_path = os.path.join(TEMP_DIR, f"{session_id}_input.pdf")
    output_pptx_path = os.path.join(TEMP_DIR, f"{session_id}_output.pptx")
    temp_images = []

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        with open(input_pdf_path, "wb") as f:
            f.write(content)

        logger.info(f"Converting PDF to PPT: {file.filename} ({len(content)} bytes)")

        doc = fitz.open(input_pdf_path)
        prs = pptx.Presentation()

        # Set 16:9 Widescreen slide format (13.333 x 7.5 inches)
        prs.slide_width = PptxInches(13.333)
        prs.slide_height = PptxInches(7.5)
        blank_slide_layout = prs.slide_layouts[6]  # Blank layout

        for page_idx, page in enumerate(doc):
            slide = prs.slides.add_slide(blank_slide_layout)

            # 1. Render high-resolution image of the page
            pix = page.get_pixmap(dpi=180)
            img_path = os.path.join(TEMP_DIR, f"{session_id}_slide_{page_idx+1}.png")
            pix.save(img_path)
            temp_images.append(img_path)

            # Calculate aspect ratio to center page image on widescreen slide
            page_rect = page.rect
            pdf_w = page_rect.width
            pdf_h = page_rect.height
            aspect_ratio = pdf_w / pdf_h

            target_slide_w = prs.slide_width
            target_slide_h = prs.slide_height

            # Fit image within 16:9 bounds while preserving proportions
            if aspect_ratio >= (13.333 / 7.5):
                img_w = target_slide_w
                img_h = target_slide_w / aspect_ratio
                img_left = PptxInches(0)
                img_top = (target_slide_h - img_h) / 2
            else:
                img_h = target_slide_h
                img_w = target_slide_h * aspect_ratio
                img_top = PptxInches(0)
                img_left = (target_slide_w - img_w) / 2

            slide.shapes.add_picture(img_path, img_left, img_top, width=img_w, height=img_h)

        doc.close()
        prs.save(output_pptx_path)

        if not os.path.exists(output_pptx_path) or os.path.getsize(output_pptx_path) == 0:
            raise HTTPException(status_code=500, detail="Failed to produce PowerPoint presentation.")

        out_name = f"{os.path.splitext(file.filename)[0]}.pptx"
        all_to_clean = [input_pdf_path, output_pptx_path] + temp_images
        background_tasks.add_task(cleanup_files, *all_to_clean)

        return FileResponse(
            path=output_pptx_path,
            filename=out_name,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        )

    except HTTPException:
        cleanup_files(input_pdf_path, output_pptx_path, *temp_images)
        raise
    except Exception as e:
        logger.error(f"Error in PDF to PPT: {e}", exc_info=True)
        cleanup_files(input_pdf_path, output_pptx_path, *temp_images)
        raise HTTPException(status_code=500, detail=f"Conversion error: {str(e)}")


@app.post("/api/convert/protect-pdf")
async def protect_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    password: str = Form(...),
):
    """
    Encrypts a PDF file using 256-bit AES encryption with the user-provided password.
    """
    if not file.filename.lower().endswith(".pdf") and file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    if not password or len(password.strip()) == 0:
        raise HTTPException(status_code=400, detail="Password cannot be empty.")

    session_id = uuid.uuid4().hex
    input_pdf_path = os.path.join(TEMP_DIR, f"{session_id}_input.pdf")
    output_pdf_path = os.path.join(TEMP_DIR, f"{session_id}_protected.pdf")

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        with open(input_pdf_path, "wb") as f:
            f.write(content)

        doc = fitz.open(input_pdf_path)
        doc.save(
            output_pdf_path,
            encryption=fitz.PDF_ENCRYPT_AES_256,
            user_pw=password,
            owner_pw=password,
            permissions=fitz.PDF_PERM_ACCESSIBILITY | fitz.PDF_PERM_PRINT | fitz.PDF_PERM_COPY,
        )
        doc.close()

        if not os.path.exists(output_pdf_path) or os.path.getsize(output_pdf_path) == 0:
            raise HTTPException(status_code=500, detail="Failed to generate protected PDF.")

        out_name = f"{os.path.splitext(file.filename)[0]}_protected.pdf"
        background_tasks.add_task(cleanup_files, input_pdf_path, output_pdf_path)

        return FileResponse(
            path=output_pdf_path,
            filename=out_name,
            media_type="application/pdf",
        )

    except HTTPException:
        cleanup_files(input_pdf_path, output_pdf_path)
        raise
    except Exception as e:
        logger.error(f"Error in Protect PDF: {e}", exc_info=True)
        cleanup_files(input_pdf_path, output_pdf_path)
        raise HTTPException(status_code=500, detail=f"Protect PDF error: {str(e)}")


@app.post("/api/convert/unlock-pdf")
async def unlock_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    password: str = Form(""),
):
    """
    Unlocks an encrypted PDF file using the provided password and outputs an unencrypted PDF.
    """
    if not file.filename.lower().endswith(".pdf") and file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    session_id = uuid.uuid4().hex
    input_pdf_path = os.path.join(TEMP_DIR, f"{session_id}_input.pdf")
    output_pdf_path = os.path.join(TEMP_DIR, f"{session_id}_unlocked.pdf")

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        with open(input_pdf_path, "wb") as f:
            f.write(content)

        doc = fitz.open(input_pdf_path)
        if doc.is_encrypted:
            authenticated = doc.authenticate(password or "")
            if not authenticated:
                doc.close()
                raise HTTPException(status_code=400, detail="Incorrect password. Unable to unlock encrypted PDF.")

        doc.save(output_pdf_path, encryption=fitz.PDF_ENCRYPT_NONE)
        doc.close()

        if not os.path.exists(output_pdf_path) or os.path.getsize(output_pdf_path) == 0:
            raise HTTPException(status_code=500, detail="Failed to generate unlocked PDF.")

        out_name = f"{os.path.splitext(file.filename)[0]}_unlocked.pdf"
        background_tasks.add_task(cleanup_files, input_pdf_path, output_pdf_path)

        return FileResponse(
            path=output_pdf_path,
            filename=out_name,
            media_type="application/pdf",
        )

    except HTTPException:
        cleanup_files(input_pdf_path, output_pdf_path)
        raise
    except Exception as e:
        logger.error(f"Error in Unlock PDF: {e}", exc_info=True)
        cleanup_files(input_pdf_path, output_pdf_path)
        raise HTTPException(status_code=500, detail=f"Unlock PDF error: {str(e)}")


def convert_docx_with_word_com(input_path: str, output_path: str) -> bool:
    """Uses Windows MS Word COM Automation to convert .docx to .pdf with 100% visual layout, logo, and header fidelity."""
    try:
        import win32com.client
        import pythoncom
        pythoncom.CoInitialize()
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        doc = word.Documents.Open(os.path.abspath(input_path))
        doc.SaveAs(os.path.abspath(output_path), FileFormat=17)  # 17 = wdFormatPDF
        doc.Close(0)
        word.Quit()
        pythoncom.CoUninitialize()
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            logger.info("Successfully converted Word to PDF via native MS Word COM automation!")
            return True
    except Exception as e:
        logger.warning(f"Word COM automation note: {e}")
    return False


def convert_pptx_with_ppt_com(input_path: str, output_path: str) -> bool:
    """Uses Windows MS PowerPoint COM Automation to convert .pptx to .pdf with 100% presentation slide fidelity."""
    try:
        import win32com.client
        import pythoncom
        pythoncom.CoInitialize()
        ppt = win32com.client.Dispatch("PowerPoint.Application")
        presentation = ppt.Presentations.Open(os.path.abspath(input_path), WithWindow=False)
        presentation.SaveAs(os.path.abspath(output_path), 32)  # 32 = ppSaveAsPDF
        presentation.Close()
        ppt.Quit()
        pythoncom.CoUninitialize()
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            logger.info("Successfully converted PPT to PDF via native PowerPoint COM automation!")
            return True
    except Exception as e:
        logger.warning(f"PowerPoint COM automation note: {e}")
    return False


def write_text_to_pdf(pdf_doc, current_page, text, font_size, is_heading, y, page_w, page_h, margin):
    max_w = page_w - margin * 2
    words = text.split(" ")
    lines = []
    current_line = ""
    for w in words:
        test_line = f"{current_line} {w}".strip() if current_line else w
        approx_w = len(test_line) * (font_size * 0.52)
        if approx_w > max_w and current_line:
            lines.append(current_line)
            current_line = w
        else:
            current_line = test_line
    if current_line:
        lines.append(current_line)

    line_height = font_size * 1.35
    for line in lines:
        if y + line_height > page_h - margin:
            current_page = pdf_doc.new_page(width=page_w, height=page_h)
            y = margin + font_size

        color = (0.05, 0.09, 0.18) if is_heading else (0.15, 0.15, 0.15)
        current_page.insert_text((margin, y), line, fontsize=font_size, fontname="helv", color=color)
        y += line_height

    y += 6
    return current_page, y


@app.post("/api/convert/word-to-pdf")
async def convert_word_to_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    High-fidelity Word (.docx) / Text file to PDF conversion.
    Parses document structure, headings, text styles, tables, and renders clean A4 PDF.
    """
    filename_lower = file.filename.lower()
    session_id = uuid.uuid4().hex
    input_file_path = os.path.join(TEMP_DIR, f"{session_id}_input_{file.filename}")
    output_pdf_path = os.path.join(TEMP_DIR, f"{session_id}_output.pdf")

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        with open(input_file_path, "wb") as f:
            f.write(content)

        logger.info(f"Converting Word to PDF: {file.filename} ({len(content)} bytes)")

        # Method 1: Primary 100% Visual Fidelity Conversion via Native MS Word COM Automation
        if filename_lower.endswith(".docx") or filename_lower.endswith(".doc"):
            if convert_docx_with_word_com(input_file_path, output_pdf_path):
                out_name = f"{os.path.splitext(file.filename)[0]}.pdf"
                background_tasks.add_task(cleanup_files, input_file_path, output_pdf_path)
                return FileResponse(
                    path=output_pdf_path,
                    filename=out_name,
                    media_type="application/pdf",
                )

        # Method 2: High-Fidelity Python Fallback (python-docx + PyMuPDF)
        pdf_doc = fitz.open()
        page_w = 595.28
        page_h = 841.89
        margin = 45.0

        if filename_lower.endswith(".docx") or filename_lower.endswith(".doc"):
            try:
                word_doc = docx.Document(input_file_path)
            except Exception as e:
                logger.warning(f"python-docx load failed: {e}. Reading plain text fallback...")
                word_doc = None

            current_page = pdf_doc.new_page(width=page_w, height=page_h)
            y = margin + 15

            if word_doc:
                paragraphs_list = []

                # Method 1: Extract all paragraph nodes from document body XML (covers tables, frames & body)
                try:
                    for p_elem in word_doc.element.body.xpath('.//w:p'):
                        texts = [node.text for node in p_elem.xpath('.//w:t') if node.text]
                        if texts:
                            p_str = "".join(texts).strip()
                            if p_str:
                                paragraphs_list.append(p_str)
                except Exception as xe:
                    logger.debug(f"XPath paragraph extraction note: {xe}")

                # Method 2: Fallback to standard word_doc.paragraphs & tables if XPath returns empty
                if not paragraphs_list:
                    for para in word_doc.paragraphs:
                        t = para.text.strip()
                        if t:
                            paragraphs_list.append(t)
                    for table in word_doc.tables:
                        for row in table.rows:
                            r_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                            if r_cells:
                                paragraphs_list.append(" | ".join(r_cells))

                for para_text in paragraphs_list:
                    is_h = len(para_text) < 60 and (para_text.isupper() or "heading" in para_text.lower() or "title" in para_text.lower())
                    font_sz = 14 if is_h else 11

                    current_page, y = write_text_to_pdf(
                        pdf_doc, current_page, para_text, font_sz, is_h, y, page_w, page_h, margin
                    )
            else:
                with open(input_file_path, "r", encoding="utf-8", errors="ignore") as f:
                    txt = f.read()
                for line in txt.split("\n"):
                    trimmed = line.strip()
                    if trimmed:
                        current_page, y = write_text_to_pdf(
                            pdf_doc, current_page, trimmed, 11, False, y, page_w, page_h, margin
                        )
        else:
            current_page = pdf_doc.new_page(width=page_w, height=page_h)
            y = margin + 15
            with open(input_file_path, "r", encoding="utf-8", errors="ignore") as f:
                txt = f.read()
            for line in txt.split("\n"):
                trimmed = line.strip()
                if trimmed:
                    current_page, y = write_text_to_pdf(
                        pdf_doc, current_page, trimmed, 11, False, y, page_w, page_h, margin
                    )

        pdf_doc.save(output_pdf_path)
        pdf_doc.close()

        if not os.path.exists(output_pdf_path) or os.path.getsize(output_pdf_path) == 0:
            raise HTTPException(status_code=500, detail="Failed to produce PDF document.")

        out_name = f"{os.path.splitext(file.filename)[0]}.pdf"
        background_tasks.add_task(cleanup_files, input_file_path, output_pdf_path)

        return FileResponse(
            path=output_pdf_path,
            filename=out_name,
            media_type="application/pdf",
        )

    except HTTPException:
        cleanup_files(input_file_path, output_pdf_path)
        raise
    except Exception as e:
        logger.error(f"Error in Word to PDF: {e}", exc_info=True)
        cleanup_files(input_file_path, output_pdf_path)
        raise HTTPException(status_code=500, detail=f"Conversion error: {str(e)}")


@app.post("/api/convert/ppt-to-pdf")
async def convert_ppt_to_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    High-fidelity PowerPoint (.pptx) to PDF conversion.
    Parses presentation slides, shapes, text, bullet lists, tables, images, and layout.
    Outputs clean presentation PDF slide deck matching original slide dimensions.
    """
    filename_lower = file.filename.lower()
    session_id = uuid.uuid4().hex
    input_file_path = os.path.join(TEMP_DIR, f"{session_id}_input_{file.filename}")
    output_pdf_path = os.path.join(TEMP_DIR, f"{session_id}_output.pdf")
    extracted_images = []

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        with open(input_file_path, "wb") as f:
            f.write(content)

        logger.info(f"Converting PPT to PDF: {file.filename} ({len(content)} bytes)")

        # Method 1: Primary 100% Visual Fidelity Conversion via Native PowerPoint COM Automation
        if filename_lower.endswith(".pptx") or filename_lower.endswith(".ppt"):
            if convert_pptx_with_ppt_com(input_file_path, output_pdf_path):
                out_name = f"{os.path.splitext(file.filename)[0]}.pdf"
                background_tasks.add_task(cleanup_files, input_file_path, output_pdf_path)
                return FileResponse(
                    path=output_pdf_path,
                    filename=out_name,
                    media_type="application/pdf",
                )

        # Method 2: High-Fidelity Python Fallback (python-pptx + PyMuPDF)
        prs = pptx.Presentation(input_file_path)
        pdf_doc = fitz.open()

        slide_w_pt = (prs.slide_width.inches * 72) if (prs and prs.slide_width) else 720.0
        slide_h_pt = (prs.slide_height.inches * 72) if (prs and prs.slide_height) else 405.0

        for slide_idx, slide in enumerate(prs.slides):
            page = pdf_doc.new_page(width=slide_w_pt, height=slide_h_pt)

            for shape in slide.shapes:
                if shape.has_text_frame:
                    tf = shape.text_frame
                    if not tf.text.strip():
                        continue
                    
                    left = (shape.left.inches * 72) if shape.left else 30
                    top = (shape.top.inches * 72) if shape.top else 30
                    width = (shape.width.inches * 72) if shape.width else (slide_w_pt - 60)
                    
                    # Full vertical room boundary to prevent text overflow clipping
                    rect = fitz.Rect(left, top, min(slide_w_pt - 20, left + width), slide_h_pt - 20)

                    is_title = False
                    if shape == slide.shapes.title or "title" in (shape.name or "").lower():
                        is_title = True

                    font_size = 18 if is_title else 11
                    font_name = "helv"
                    color = (0.05, 0.09, 0.18) if is_title else (0.15, 0.15, 0.15)

                    page.insert_textbox(rect, tf.text, fontsize=font_size, fontname=font_name, color=color, align=0)

                elif shape.has_table:
                    table = shape.table
                    left = (shape.left.inches * 72) if shape.left else 30
                    top = (shape.top.inches * 72) if shape.top else 100
                    width = (shape.width.inches * 72) if shape.width else (slide_w_pt - 60)
                    rect = fitz.Rect(left, top, min(slide_w_pt - 20, left + width), slide_h_pt - 20)

                    table_rows_text = []
                    for row in table.rows:
                        row_cells = [cell.text.strip() for cell in row.cells]
                        table_rows_text.append(" | ".join(row_cells))
                    
                    table_text = "\n".join(table_rows_text)
                    page.insert_textbox(rect, table_text, fontsize=10, fontname="helv", color=(0.1, 0.15, 0.25), align=0)

                elif getattr(shape, "shape_type", None) == MSO_SHAPE_TYPE.PICTURE or hasattr(shape, "image"):
                    try:
                        image = shape.image
                        img_bytes = image.blob
                        img_ext = image.ext
                        img_tmp_path = os.path.join(TEMP_DIR, f"{session_id}_img_{len(extracted_images)}.{img_ext}")
                        with open(img_tmp_path, "wb") as f_img:
                            f_img.write(img_bytes)
                        extracted_images.append(img_tmp_path)

                        left = (shape.left.inches * 72) if shape.left else 30
                        top = (shape.top.inches * 72) if shape.top else 100
                        width = (shape.width.inches * 72) if shape.width else 200
                        height = (shape.height.inches * 72) if shape.height else 150
                        img_rect = fitz.Rect(left, top, min(slide_w_pt - 20, left + width), min(slide_h_pt - 20, top + height))
                        page.insert_image(img_rect, filename=img_tmp_path)
                    except Exception as img_err:
                        logger.warning(f"Slide image insertion error: {img_err}")

        pdf_doc.save(output_pdf_path)
        pdf_doc.close()

        if not os.path.exists(output_pdf_path) or os.path.getsize(output_pdf_path) == 0:
            raise HTTPException(status_code=500, detail="Failed to produce PDF from PPT presentation.")

        out_name = f"{os.path.splitext(file.filename)[0]}.pdf"
        all_to_clean = [input_file_path, output_pdf_path] + extracted_images
        background_tasks.add_task(cleanup_files, *all_to_clean)

        return FileResponse(
            path=output_pdf_path,
            filename=out_name,
            media_type="application/pdf",
        )

    except HTTPException:
        cleanup_files(input_file_path, output_pdf_path, *extracted_images)
        raise
    except Exception as e:
        logger.error(f"Error in PPT to PDF: {e}", exc_info=True)
        cleanup_files(input_file_path, output_pdf_path, *extracted_images)
        raise HTTPException(status_code=500, detail=f"Conversion error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
