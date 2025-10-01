import * as fs from 'fs';
import * as path from 'path';
import { PDFExtract, PDFExtractOptions } from 'pdf.js-extract';

async function pdfToMarkdown(pdfPath: string): Promise<string> {
  try {
    const pdfExtract = new PDFExtract();
    const options: PDFExtractOptions = {
      firstPage: 1,
      lastPage: undefined,
      password: '',
      verbosity: 0,
    };

    const data = await pdfExtract.extract(pdfPath, options);
    
    if (!data || !data.pages || data.pages.length === 0) {
      return 'No text found in PDF. This PDF may need manual OCR processing.';
    }

    let markdown = '';
    let previousPage = 0;
    
    for (const page of data.pages) {
      if (page.pageNumber !== previousPage) {
        if (previousPage > 0) {
          markdown += '\n\n';
        }
        markdown += `# Page ${page.pageNumber}\n\n`;
        previousPage = page.pageNumber;
      }
      
      if (!page.content || page.content.length === 0) {
        markdown += '*No text found on this page. OCR may be required.*\n\n';
        continue;
      }
      
      for (const item of page.content) {
        const text = item.str.trim();
        if (!text) continue;
        
        // Basic formatting based on text position and size
        if (item.height > 16) {
          markdown += `## ${text}\n\n`;
        } else if (item.height > 12) {
          markdown += `### ${text}\n\n`;
        } else {
          markdown += `${text} `;
        }
      }
      
      markdown = markdown.trim() + '\n\n';
    }
    
    return markdown.trim() || 'No extractable text found in PDF. This PDF may need manual OCR processing.';
  } catch (error) {
    if (error instanceof Error) {
      return `Error processing PDF: ${error.message}. This PDF may need manual OCR processing.`;
    }
    return 'Error processing PDF. This PDF may need manual OCR processing.';
  }
}

async function convertPdfFileToMarkdown(pdfFilePath: string, outputFilePath?: string): Promise<void> {
  const markdown = await pdfToMarkdown(pdfFilePath);
  
  if (outputFilePath) {
    fs.writeFileSync(outputFilePath, markdown);
    console.log(`Markdown saved to ${outputFilePath}`);
  } else {
    console.log(markdown);
  }
}

export { pdfToMarkdown, convertPdfFileToMarkdown };