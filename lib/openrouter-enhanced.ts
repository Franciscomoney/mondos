import { getSettings } from './db';
import { extractTextFromPDF, splitTextIntoChunks } from './simple-pdf-processor';
import fs from 'fs/promises';
import path from 'path';

interface ProcessFileParams {
  filePath: string;
  fileType: 'image' | 'pdf';
  language: string;
  isPublicUrl?: boolean;
}

interface ProcessingResult {
  extractedText: string;
  markdownContent: string;
  usage: any;
  pageCount?: number;
  processingMethod?: string;
}

export async function processFileWithEnhancedOCR({ 
  filePath, 
  fileType, 
  language, 
  isPublicUrl = false 
}: ProcessFileParams): Promise<ProcessingResult> {
  const settings = await getSettings();
  
  if (!settings.openrouter_api_key) {
    throw new Error('OpenRouter API key not configured');
  }

  console.log('Processing file:', { filePath, fileType, language, isPublicUrl });
  console.log('Settings loaded:', settings);
  console.log('Using models:', { ocr: settings.ocr_model_id, text: settings.text_model_id });

  let extractedText = '';
  let pageCount = 1;
  let processingMethod = 'single-image';

  // Handle PDFs differently
  if (fileType === 'pdf' && !isPublicUrl) {
    console.log('Processing PDF document...');
    
    try {
      // First try to extract embedded text
      const pages = await extractTextFromPDF(filePath);
      pageCount = pages.length;
      console.log(`PDF has ${pageCount} pages`);
      
      // Check if we have good embedded text
      const hasGoodText = pages.some(p => p.hasText && p.text.length > 100);
      
      if (hasGoodText) {
        // Use embedded text
        processingMethod = 'embedded-text';
        extractedText = pages
          .filter(p => p.hasText)
          .map(p => `[Page ${p.pageNumber}]\n\n${p.text}`)
          .join('\n\n---\n\n');
        
        console.log(`Extracted ${extractedText.length} characters from embedded text`);
      } else {
        // PDF is scanned, need OCR for each page
        processingMethod = 'page-by-page-ocr';
        console.log('PDF appears to be scanned, using OCR for each page...');
        
        // For now, we'll process as a single document
        // In a production system, you'd convert each page to an image and OCR separately
        extractedText = await processWithOCR(filePath, fileType, language, settings, isPublicUrl);
      }
    } catch (error) {
      console.error('Error with PDF text extraction, falling back to OCR:', error);
      extractedText = await processWithOCR(filePath, fileType, language, settings, isPublicUrl);
    }
  } else {
    // Process images or URLs
    extractedText = await processWithOCR(filePath, fileType, language, settings, isPublicUrl);
  }

  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error('No text could be extracted from the document');
  }

  // Process the text in chunks if it's very long
  const MAX_TOKENS_PER_REQUEST = 100000; // Much larger limit for better models
  const CHARS_PER_TOKEN = 4; // Rough estimate
  const maxCharsPerChunk = MAX_TOKENS_PER_REQUEST * CHARS_PER_TOKEN;
  
  let markdownContent = '';
  
  if (extractedText.length > maxCharsPerChunk) {
    console.log(`Text is very long (${extractedText.length} chars), processing in chunks...`);
    const chunks = splitTextIntoChunks(extractedText, maxCharsPerChunk);
    console.log(`Split into ${chunks.length} chunks`);
    
    const processedChunks: string[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}...`);
      const chunkMarkdown = await structureTextWithLLM(
        chunks[i], 
        language, 
        settings,
        i === 0 ? 'first' : i === chunks.length - 1 ? 'last' : 'middle'
      );
      processedChunks.push(chunkMarkdown);
    }
    
    markdownContent = processedChunks.join('\n\n---\n\n');
  } else {
    // Process in one go
    markdownContent = await structureTextWithLLM(extractedText, language, settings, 'complete');
  }

  return {
    extractedText,
    markdownContent,
    usage: {
      ocr: { total_tokens: Math.ceil(extractedText.length / 4) },
      structure: { total_tokens: Math.ceil(markdownContent.length / 4) },
    },
    pageCount,
    processingMethod
  };
}

async function processWithOCR(
  filePath: string,
  fileType: 'image' | 'pdf',
  language: string,
  settings: any,
  isPublicUrl: boolean
): Promise<string> {
  let fileData: string;
  
  if (isPublicUrl) {
    fileData = filePath;
  } else {
    const fileBuffer = await fs.readFile(filePath);
    const base64 = fileBuffer.toString('base64');
    
    const fileSizeMB = fileBuffer.length / (1024 * 1024);
    console.log(`File size: ${fileSizeMB.toFixed(2)} MB`);
    
    if (fileSizeMB > 30) {
      throw new Error('File too large for OCR processing (max 30MB)');
    }
    
    let mimeType = 'image/jpeg';
    if (fileType === 'pdf') {
      // Use proper PDF mime type
      mimeType = 'application/pdf';
    } else if (filePath.toLowerCase().endsWith('.png')) {
      mimeType = 'image/png';
    }
    
    fileData = `data:${mimeType};base64,${base64}`;
  }

  console.log('Starting OCR request...');
  // Use a more reliable model for PDF processing
  let ocrModel = settings.ocr_model_id || 'openai/gpt-4o-mini';
  
  // Fallback to working models if the configured one fails
  // These are actual model IDs available on OpenRouter
  const fallbackModels = [
    'openai/gpt-4o-mini',
    'openai/gpt-4-turbo', 
    'google/gemini-pro-vision',
    'anthropic/claude-3-haiku',
    'mistralai/mistral-nemo'
  ];
  
  console.log('OCR Model to use:', ocrModel);
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300000); // 5 minute timeout for large documents
  
  try {
    // Use a better prompt for complete extraction
    const ocrPrompt = `You are an expert OCR system. Extract ALL text from this ${fileType === 'pdf' ? 'PDF document' : 'image'}. 

CRITICAL INSTRUCTIONS:
1. Extract EVERY SINGLE PAGE of text from the document
2. DO NOT summarize or skip sections
3. DO NOT use placeholders like "[Document continues...]" or "[Additional pages...]"
4. Extract the COMPLETE text from beginning to end
5. If this is a multi-page document, process ALL pages
6. Preserve the original formatting, structure, and line breaks
7. Include page numbers or section breaks where visible

The document is in ${language}. Output ONLY the extracted text, nothing else.`;

    let ocrResponse;
    let lastError;
    const modelsToTry = [ocrModel, ...fallbackModels.filter(m => m !== ocrModel)];
    
    for (const modelToUse of modelsToTry) {
      try {
        console.log(`Attempting OCR with model: ${modelToUse}`);
        
        // For PDF files, we need to ensure proper content type
        const messageContent: any[] = [
          {
            type: 'text',
            text: ocrPrompt
          }
        ];
        
        // Handle different content types based on file type
        // For now, treat PDFs as images since OpenAI doesn't support file type properly
        messageContent.push({
          type: 'image_url',
          image_url: {
            url: fileData,
            detail: 'high'
          }
        });
        
        const requestBody: any = {
          model: modelToUse,
          messages: [
            {
              role: 'user',
              content: messageContent
            }
          ],
          temperature: 0.1,
          max_tokens: 100000, // Much higher limit
          stream: false,
        };
        
        // Add PDF processing configuration for PDFs
        if (fileType === 'pdf') {
          requestBody.provider = {
            order: ['OpenAI'],  // Force OpenAI as it supports PDFs better
            allow_fallbacks: true
          };
          // Try different PDF engines based on model
          if (modelToUse.includes('openai')) {
            // OpenAI models don't use pdf_engine
          } else {
            requestBody.pdf_engine = 'pdf-text'; // Use free text extraction
          }
        }
        
        ocrResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.openrouter_api_key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:10001',
            'X-Title': 'Jose-Otalora Document Digitization',
          },
          signal: controller.signal,
          body: JSON.stringify(requestBody)
        });
        
        if (ocrResponse.ok) {
          console.log(`Successfully used model: ${modelToUse}`);
          break; // Success, exit the loop
        } else {
          const errorText = await ocrResponse.text();
          lastError = `Model ${modelToUse} failed: ${errorText}`;
          console.error(lastError);
          continue; // Try next model
        }
      } catch (error) {
        lastError = `Model ${modelToUse} error: ${error}`;
        console.error(lastError);
        continue; // Try next model
      }
    }
    
    clearTimeout(timeout);

    if (!ocrResponse || !ocrResponse.ok) {
      console.error('All OCR models failed:', lastError);
      throw new Error(`OCR failed after trying all models: ${lastError}`);
    }

    const ocrData = await ocrResponse.json();
    
    if (!ocrData?.choices?.[0]?.message?.content) {
      throw new Error('OCR failed: No text extracted from document');
    }
    
    const extractedText = ocrData.choices[0].message.content;
    console.log(`Extracted ${extractedText.length} characters via OCR`);
    
    return extractedText;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('OCR request timed out');
    }
    throw error;
  }
}

async function structureTextWithLLM(
  text: string,
  language: string,
  settings: any,
  chunkPosition: 'first' | 'middle' | 'last' | 'complete'
): Promise<string> {
  console.log(`Structuring text with LLM (${chunkPosition} chunk, ${text.length} chars)...`);
  
  let systemPrompt = `You are a document formatting expert. Your task is to take raw OCR text and structure it into clean, well-formatted Markdown. Preserve the document's original structure while improving readability. The document is in ${language}.`;
  
  if (chunkPosition !== 'complete') {
    systemPrompt += `\n\nThis is the ${chunkPosition} chunk of a larger document. Maintain continuity with other chunks.`;
  }
  
  systemPrompt += '\n\nIMPORTANT: Output ONLY the markdown content directly. Do NOT wrap the output in code blocks or backticks.';

  const structureResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.openrouter_api_key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:10001',
      'X-Title': 'Jose-Otalora Document Digitization',
    },
    body: JSON.stringify({
      model: settings.text_model_id || 'mistralai/mistral-large-2411',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Please convert this raw text into well-structured Markdown:\n\n${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 50000, // Higher limit for proper formatting
      stream: false,
    })
  });

  if (!structureResponse.ok) {
    const error = await structureResponse.text();
    console.error('Structure API error:', error);
    throw new Error(`Text structuring failed: ${error}`);
  }

  const structureData = await structureResponse.json();
  
  if (!structureData?.choices?.[0]?.message?.content) {
    throw new Error('Text structuring failed: No structured content generated');
  }
  
  let markdownContent = structureData.choices[0].message.content;
  
  // Clean up markdown if wrapped in code blocks
  const codeBlockRegex = /^```(?:markdown)?\n([\s\S]*)\n```$/;
  const match = markdownContent.match(codeBlockRegex);
  if (match) {
    markdownContent = match[1].trim();
  }
  
  markdownContent = markdownContent.replace(/^`+|`+$/g, '').trim();
  
  return markdownContent;
}