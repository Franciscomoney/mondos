import fs from 'fs/promises';

interface PDFPage {
  pageNumber: number;
  text: string;
  hasText: boolean;
}

export async function extractTextFromPDF(filePath: string): Promise<PDFPage[]> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    
    // Check if it's a PDF file by looking for PDF signature
    if (dataBuffer.length < 4 || 
        dataBuffer[0] !== 0x25 ||  // %
        dataBuffer[1] !== 0x50 ||  // P
        dataBuffer[2] !== 0x44 ||  // D
        dataBuffer[3] !== 0x46) {  // F
      throw new Error('Invalid PDF file');
    }
    
    // For now, skip embedded text extraction since pdf-parse has issues
    // This will force all PDFs to go through OCR processing
    console.log('Treating PDF as scanned document for OCR processing');
    
    // If pdf-parse fails or returns no text, it's likely a scanned PDF
    return [{
      pageNumber: 1,
      text: '',
      hasText: false
    }];
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error('Failed to process PDF file');
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