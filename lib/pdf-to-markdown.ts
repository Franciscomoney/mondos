import { existsSync } from 'fs';
import path from 'path';
import { convertPDFToMarkdownFixed } from './pdf-to-markdown-fixed';

interface PDFConversionResult {
  markdown: string;
  pageCount: number;
  processingMethod: string;
  extractedText: string;
}

export async function convertPDFToMarkdown(
  pdfPath: string,
  language: string = 'English',
  modelTier: string = 'free'
): Promise<PDFConversionResult> {
  try {
    // Check if file exists
    if (!existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }

    // Get file extension
    const ext = path.extname(pdfPath).toLowerCase();
    if (ext !== '.pdf') {
      throw new Error(`Invalid file type. Expected PDF, got: ${ext}`);
    }

    // Use the fixed PDF to Markdown converter
    return await convertPDFToMarkdownFixed(pdfPath, language, modelTier);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to convert PDF to Markdown: ${error.message}`);
    }
    throw new Error('Failed to convert PDF to Markdown: Unknown error occurred');
  }
}