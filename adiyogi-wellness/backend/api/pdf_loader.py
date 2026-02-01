from PyPDF2 import PdfReader


def load_pdf_text(path: str) -> str:
    reader = PdfReader(path)

    text = ""

    for page in reader.pages:
        try:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        except Exception:
            pass

    return text.strip()
