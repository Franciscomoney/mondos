import * as fs from 'fs';
import * as path from 'path';

async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      return 'Error: File not found';
    }

    const fileExtension = path.extname(filePath).toLowerCase();
    if (fileExtension !== '.pdf') {
      return 'Error: File is not a PDF';
    }

    const dataBuffer = fs.readFileSync(filePath);
    
    // Simple text extraction using regular expressions
    // This approach looks for text within PDF content streams
    const textMatches = dataBuffer.toString('binary').match(/BT[\s\S]*?Td[\s\S]*?Tj[\s\S]*?ET/g);
    
    if (!textMatches || textMatches.length === 0) {
      return 'No embedded text found in PDF';
    }

    // Extract readable text from the matches
    let extractedText = '';
    for (const match of textMatches) {
      const contentMatches = match.match(/\(([^)]+)\)/g);
      if (contentMatches) {
        for (const content of contentMatches) {
          extractedText += content.slice(1, -1) + ' ';
        }
      }
    }

    // Clean up common PDF encoding artifacts
    extractedText = extractedText
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\(.)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    if (!extractedText) {
      return 'No embedded text found in PDF';
    }

    return extractedText;
  } catch (error) {
    return `Error processing PDF: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

export { extractTextFromPDF };