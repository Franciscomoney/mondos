import { getSettings } from './db';
import fs from 'fs/promises';
import { PDFDocument } from 'pdf-lib';
import { extractPDFText } from './pdf-text-extract';

interface PDFConversionResult {
  markdown: string;
  pageCount: number;
  processingMethod: string;
  extractedText: string;
}

/**
 * Convert PDF to Markdown using proper PDF text extraction
 */
export async function convertPDFToMarkdownFixed(
  pdfPath: string,
  language: string = 'English',
  modelTier: string = 'free'
): Promise<PDFConversionResult> {
  try {
    console.log('Converting PDF to Markdown:', { pdfPath, language });

    // Load the PDF
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();

    console.log(`PDF has ${pageCount} pages`);

    // Extract text using our reliable extractor
    let extractedText = '';
    try {
      extractedText = await extractPDFText(Buffer.from(pdfBytes));
    } catch (error: any) {
      console.log('Text extraction completely failed:', error.message);
    }

    let markdown = '';
    let processingMethod = '';

    // Check if we got good text
    if (extractedText && extractedText.trim().length > 100) {
      // We have embedded text - just format it
      processingMethod = 'embedded-text-formatting';
      console.log('Using embedded text with AI formatting');

      markdown = await formatTextToMarkdown(extractedText, language, modelTier);
    } else {
      // No embedded text - need OCR
      processingMethod = 'full-ocr';
      console.log('No embedded text found, using full OCR');

      const base64 = pdfBytes.toString('base64');
      const dataUrl = `data:application/pdf;base64,${base64}`;

      markdown = await performOCRAndFormat(dataUrl, language, pageCount, modelTier);
      extractedText = markdown.replace(/[#*_[\]()\-`]/g, '').trim();
    }

    return {
      markdown,
      pageCount,
      processingMethod,
      extractedText: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : '')
    };
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw new Error(`Failed to convert PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Format extracted text into clean Markdown
 */
async function formatTextToMarkdown(text: string, language: string, modelTier: string = 'free'): Promise<string> {
  const settings = await getSettings();

  if (!settings.openrouter_api_key) {
    // No API key - return text as-is with basic formatting
    return formatTextBasic(text);
  }

  // Select model based on tier
  let selectedModel: string;
  switch (modelTier) {
    case 'fast':
      selectedModel = 'x-ai/grok-4-fast';
      break;
    case 'premium':
      selectedModel = 'google/gemini-2.5-flash';
      break;
    case 'free':
    default:
      selectedModel = 'google/gemini-2.0-flash-exp:free';
      break;
  }

  console.log(`Formatting text with AI (${modelTier} tier, model: ${selectedModel})...`);

  const prompt = `You are a document formatting expert. Convert this raw text into clean, well-structured Markdown.

INSTRUCTIONS:
1. Analyze the text structure and identify: headings, paragraphs, lists, tables, quotes
2. Apply proper Markdown formatting:
   - # for main titles
   - ## for sections
   - ### for subsections
   - - for bullet lists
   - 1. for numbered lists
   - > for quotes
   - **bold** for emphasis
3. Preserve the original content EXACTLY - do not summarize or skip any text
4. Maintain logical document flow
5. The document is in ${language}

OUTPUT: Return ONLY the formatted Markdown. Do NOT wrap it in code blocks.

TEXT TO FORMAT:
${text}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.openrouter_api_key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:10001',
        'X-Title': 'Jose-Otalora PDF Converter',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 50000,
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI formatting failed:', error);
      return formatTextBasic(text);
    }

    const data = await response.json();
    let markdown = data.choices[0].message.content;

    // Remove code block wrapping if present
    markdown = markdown.replace(/^```(?:markdown)?\n?/gm, '').replace(/\n?```$/gm, '').trim();

    return markdown;
  } catch (error) {
    console.error('AI formatting error:', error);
    return formatTextBasic(text);
  }
}

/**
 * Perform OCR on PDF and format result
 */
async function performOCRAndFormat(dataUrl: string, language: string, pageCount: number, modelTier: string = 'free'): Promise<string> {
  const settings = await getSettings();

  if (!settings.openrouter_api_key) {
    throw new Error('OpenRouter API key required for OCR');
  }

  // Select OCR model based on tier
  let modelsToTry: string[];
  switch (modelTier) {
    case 'fast':
      modelsToTry = ['x-ai/grok-4-fast', 'anthropic/claude-3-5-sonnet'];
      break;
    case 'premium':
      modelsToTry = ['google/gemini-2.5-flash', 'anthropic/claude-3-5-sonnet'];
      break;
    case 'free':
    default:
      modelsToTry = ['google/gemini-2.0-flash-exp:free', 'anthropic/claude-3-5-sonnet', 'anthropic/claude-3-haiku'];
      break;
  }

  console.log(`Performing OCR on PDF (${modelTier} tier)...`);

  const ocrPrompt = `Extract ALL text from this PDF document and format it as clean Markdown.

CRITICAL REQUIREMENTS:
1. This PDF has ${pageCount} page(s) - extract ALL of them
2. Do NOT summarize - extract COMPLETE text from every page
3. Do NOT skip sections or use placeholders like "[continues...]"
4. Format the output as proper Markdown with:
   - # for titles
   - ## for sections
   - ### for subsections
   - Lists, tables, quotes as needed
5. The document language is ${language}
6. Preserve all original content

OUTPUT: Return ONLY the complete Markdown content. No code blocks, no explanations.`;

  for (const model of modelsToTry) {
    try {
      console.log(`Trying OCR with ${model}...`);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.openrouter_api_key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:10001',
          'X-Title': 'Jose-Otalora PDF Converter',
        },
        body: JSON.stringify({
          model,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: ocrPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                  detail: 'high'
                }
              }
            ]
          }],
          temperature: 0.1,
          max_tokens: 100000,
        })
      });

      if (response.ok) {
        const data = await response.json();
        let markdown = data.choices[0].message.content;

        // Remove code block wrapping if present
        markdown = markdown.replace(/^```(?:markdown)?\n?/gm, '').replace(/\n?```$/gm, '').trim();

        console.log(`OCR successful with ${model}`);
        return markdown;
      } else {
        const error = await response.text();
        console.log(`${model} failed:`, error);
      }
    } catch (error) {
      console.log(`${model} error:`, error);
    }
  }

  throw new Error('All OCR models failed');
}

/**
 * Basic text formatting without AI
 */
function formatTextBasic(text: string): string {
  // Split into paragraphs
  const paragraphs = text.split(/\n\s*\n/);

  let markdown = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Detect if it looks like a heading (short, capitalized)
    if (trimmed.length < 60 && trimmed === trimmed.toUpperCase()) {
      markdown += `## ${trimmed}\n\n`;
    } else if (trimmed.match(/^\d+\./)) {
      // Numbered list
      markdown += `${trimmed}\n`;
    } else if (trimmed.match(/^[-•]/)) {
      // Bullet list
      markdown += `${trimmed}\n`;
    } else {
      // Regular paragraph
      markdown += `${trimmed}\n\n`;
    }
  }

  return markdown.trim();
}
