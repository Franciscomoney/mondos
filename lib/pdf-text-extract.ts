/**
 * Reliable PDF text extraction using pdf.js directly
 * Bypasses the buggy pdf-parse library
 */

export async function extractPDFText(pdfBuffer: Buffer): Promise<string> {
  try {
    // Try pdf-parse first (fast if it works)
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(pdfBuffer);
      if (data && data.text && data.text.length > 50) {
        console.log(`pdf-parse success: ${data.text.length} chars`);
        return data.text;
      }
    } catch (parseError: any) {
      // pdf-parse often fails with ENOENT error for test files
      console.log('pdf-parse failed, using pdf.js directly');
    }

    // Fallback: Use pdf.js directly (bundled with pdf-parse)
    const pdfjsLib = require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js');

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      standardFontDataUrl: '../../../pdf.js-gh-pages/web/standard_fonts/'
    });

    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;

    console.log(`Extracting text from ${numPages} pages using pdf.js`);

    let fullText = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      fullText += `\n\n[Page ${pageNum}]\n\n${pageText}`;
    }

    console.log(`Extracted ${fullText.length} characters from ${numPages} pages`);
    return fullText.trim();

  } catch (error: any) {
    console.error('PDF text extraction failed:', error.message);
    throw new Error(`Could not extract text from PDF: ${error.message}`);
  }
}
