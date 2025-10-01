import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

export async function mergePDFs(pdfPaths: string[], outputPath: string) {
  const mergedPdf = await PDFDocument.create();
  
  for (const pdfPath of pdfPaths) {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  
  const mergedPdfBytes = await mergedPdf.save();
  await fs.writeFile(outputPath, mergedPdfBytes);
  
  // Get file stats
  const stats = await fs.stat(outputPath);
  const fileSizeMB = stats.size / (1024 * 1024);
  
  return {
    pageCount: mergedPdf.getPageCount(),
    fileSizeMB
  };
}