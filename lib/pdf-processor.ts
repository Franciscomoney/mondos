import fs from 'fs/promises';
import sharp from 'sharp';

interface PDFPage {
  pageNumber: number;
  text: string;
  hasText: boolean;
}

export async function extractTextFromPDF(filePath: string): Promise<PDFPage[]> {
  try {
    // Dynamic import to avoid loading test files at module initialization
    const pdf = await import('pdf-parse').then(m => m.default);
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    
    // Extract text from each page
    const pages: PDFPage[] = [];
    const pageTexts = data.text.split('\n\n'); // Rough page splitting
    
    // Check if PDF has embedded text
    const hasEmbeddedText = data.text.trim().length > 100;
    
    if (hasEmbeddedText) {
      // If PDF has good embedded text, use it
      console.log(`PDF has embedded text (${data.numpages} pages, ${data.text.length} chars)`);
      
      // Better page splitting based on form feeds or page markers
      let currentPage = 1;
      let currentText = '';
      const lines = data.text.split('\n');
      
      for (const line of lines) {
        // Common page break indicators
        if (line.includes('\f') || line.match(/^Page \d+/) || line.match(/^\d+$/)) {
          if (currentText.trim()) {
            pages.push({
              pageNumber: currentPage,
              text: currentText.trim(),
              hasText: true
            });
            currentPage++;
            currentText = '';
          }
        } else {
          currentText += line + '\n';
        }
      }
      
      // Add the last page
      if (currentText.trim()) {
        pages.push({
          pageNumber: currentPage,
          text: currentText.trim(),
          hasText: true
        });
      }
      
      // If we didn't get enough pages, fall back to simple division
      if (pages.length < data.numpages / 2) {
        pages.length = 0;
        const charsPerPage = Math.ceil(data.text.length / data.numpages);
        for (let i = 0; i < data.numpages; i++) {
          const start = i * charsPerPage;
          const end = Math.min((i + 1) * charsPerPage, data.text.length);
          pages.push({
            pageNumber: i + 1,
            text: data.text.substring(start, end).trim(),
            hasText: true
          });
        }
      }
    } else {
      // PDF is likely scanned/image-based
      console.log(`PDF appears to be scanned (${data.numpages} pages)`);
      for (let i = 0; i < data.numpages; i++) {
        pages.push({
          pageNumber: i + 1,
          text: '',
          hasText: false
        });
      }
    }
    
    return pages;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
}

export function splitTextIntoChunks(text: string, maxChunkSize: number = 10000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += paragraph + '\n\n';
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

export async function convertPDFPageToImage(pdfPath: string, pageNumber: number): Promise<Buffer> {
  // For now, we'll return a placeholder
  // In production, you'd use pdf-poppler or similar to convert PDF pages to images
  throw new Error('PDF to image conversion not implemented. Please use a PDF with embedded text.');
}