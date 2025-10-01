import { getSettings } from './db';
import fs from 'fs/promises';

interface ProcessFileParams {
  filePath: string;
  fileType: 'image' | 'pdf';
  language: string;
  isPublicUrl?: boolean;
}

export async function processFileWithOCR({ filePath, fileType, language, isPublicUrl = false }: ProcessFileParams) {
  const settings = await getSettings();
  
  if (!settings.openrouter_api_key) {
    throw new Error('OpenRouter API key not configured');
  }

  console.log('Processing file:', { filePath, fileType, language, isPublicUrl });
  console.log('Using models:', { ocr: settings.ocr_model_id, text: settings.text_model_id });

  let extractedText = '';

  // For PDFs, we'll use OCR directly since most are scanned
  if (fileType === 'pdf' && !isPublicUrl) {
    console.log('PDF detected, will use OCR for extraction');
  }

  // If we couldn't extract text directly, use OCR
  if (!extractedText) {
    // Prepare file data
    let fileData: string;
    if (isPublicUrl) {
      fileData = filePath;
    } else {
      const fileBuffer = await fs.readFile(filePath);
      const base64 = fileBuffer.toString('base64');
      
      // Check file size
      const fileSizeMB = fileBuffer.length / (1024 * 1024);
      console.log(`File size: ${fileSizeMB.toFixed(2)} MB`);
      
      if (fileSizeMB > 30) {
        throw new Error('File too large for OCR processing (max 30MB). Please use a smaller file or split the PDF.');
      }
      
      // Determine the correct mime type
      let mimeType = 'image/jpeg';
      if (fileType === 'pdf') {
        // Try using image format for PDFs as some models handle it better
        mimeType = 'image/jpeg';
      } else if (filePath.toLowerCase().endsWith('.png')) {
        mimeType = 'image/png';
      } else if (filePath.toLowerCase().endsWith('.gif')) {
        mimeType = 'image/gif';
      } else if (filePath.toLowerCase().endsWith('.webp')) {
        mimeType = 'image/webp';
      }
      
      fileData = `data:${mimeType};base64,${base64}`;
    }

    // Step 1: OCR Extraction
    console.log('Starting OCR request...');
    
    // Use a more reliable model for OCR
    const ocrModel = settings.ocr_model_id;
    console.log('Using OCR model:', ocrModel);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
    
    try {
      const ocrResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.openrouter_api_key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:10001',
          'X-Title': 'Jose-Otalora Document Digitization',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: ocrModel,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Extract all text from this ${fileType === 'pdf' ? 'PDF document' : 'image'}. The document is in ${language}. Preserve the original formatting as much as possible, including line breaks and spacing. Just output the extracted text without any additional commentary.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: fileData,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 16000,
          stream: false,
        })
      });
      
      clearTimeout(timeout);

      if (!ocrResponse.ok) {
        const errorText = await ocrResponse.text();
        console.error('OCR API error:', errorText);
        throw new Error(`OCR failed: ${errorText}`);
      }

      const responseText = await ocrResponse.text();
      console.log('OCR Response length:', responseText.length);
      console.log('OCR Response preview:', responseText.substring(0, 500));
      
      let ocrData;
      try {
        ocrData = JSON.parse(responseText);
      } catch (e) {
        console.error('JSON parse error. Full response:', responseText);
        throw new Error('OCR failed: Invalid JSON response');
      }
      
      console.log('OCR Data structure:', {
        hasChoices: !!ocrData?.choices,
        choicesLength: ocrData?.choices?.length,
        firstChoice: ocrData?.choices?.[0],
        error: ocrData?.error
      });
      
      if (ocrData?.error) {
        console.error('API Error:', ocrData.error);
        throw new Error(`OCR failed: ${ocrData.error.message || 'API error'}`);
      }
      
      if (!ocrData?.choices?.[0]?.message?.content) {
        console.error('Invalid response structure. Full data:', JSON.stringify(ocrData));
        throw new Error('OCR failed: No text extracted from document');
      }
      
      extractedText = ocrData.choices[0].message.content;
      console.log(`Extracted ${extractedText.length} characters via OCR`);
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('OCR request timed out. File may be too large or complex.');
      }
      throw error;
    }
  }

  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error('No text could be extracted from the document');
  }

  // Step 2: Text Structuring with LLM
  console.log('Structuring text with LLM...');
  const structureResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.openrouter_api_key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:10001',
      'X-Title': 'Jose-Otalora Document Digitization',
    },
    body: JSON.stringify({
      model: settings.text_model_id,
      messages: [
        {
          role: 'system',
          content: `You are a document formatting expert. Your task is to take raw OCR text and structure it into clean, well-formatted Markdown. Preserve the document's original structure while improving readability. Identify headings, paragraphs, lists, and other structural elements. The document is in ${language}.

IMPORTANT: Output ONLY the markdown content directly. Do NOT wrap the output in code blocks or backticks. Do NOT include \`\`\`markdown or \`\`\` markers.`
        },
        {
          role: 'user',
          content: `Please convert this raw text into well-structured Markdown. Output the markdown directly without any code block wrappers:\n\n${extractedText.substring(0, 50000)}` // Limit to prevent token overflow
        }
      ],
      temperature: 0.3,
      max_tokens: 8000,
      stream: false,
    })
  });

  if (!structureResponse.ok) {
    const error = await structureResponse.text();
    console.error('Structure API error:', error);
    throw new Error(`Text structuring failed: ${error}`);
  }

  let structureData;
  try {
    structureData = await structureResponse.json();
  } catch (e) {
    throw new Error('Text structuring failed: Invalid response from OpenRouter API');
  }
  
  if (!structureData?.choices?.[0]?.message?.content) {
    throw new Error('Text structuring failed: No structured content generated');
  }
  
  let markdownContent = structureData.choices[0].message.content;
  
  // Clean up markdown if it's wrapped in code blocks
  const codeBlockRegex = /^```(?:markdown)?\n([\s\S]*)\n```$/;
  const match = markdownContent.match(codeBlockRegex);
  if (match) {
    markdownContent = match[1].trim();
  }
  
  // Also remove any leading/trailing backticks that might remain
  markdownContent = markdownContent.replace(/^`+|`+$/g, '').trim();

  return {
    extractedText,
    markdownContent,
    usage: {
      ocr: { total_tokens: Math.ceil(extractedText.length / 4) },
      structure: structureData.usage,
    }
  };
}