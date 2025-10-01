import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const settings = await getSettings();
    
    // Test with the cartapresidente.pdf file
    const pdfPath = path.join(process.cwd(), 'public', 'uploads', 'projects', 'presidente-jose-otalora', 'uploads', '1756640880729_cartapresidente.pdf');
    
    // Check if file exists
    try {
      await fs.access(pdfPath);
    } catch {
      return NextResponse.json({ error: 'PDF file not found' }, { status: 404 });
    }
    
    // Read file
    const fileBuffer = await fs.readFile(pdfPath);
    const base64 = fileBuffer.toString('base64');
    const fileSizeMB = fileBuffer.length / (1024 * 1024);
    
    // Prepare request
    const fileData = `data:application/pdf;base64,${base64}`;
    
    console.log('Testing direct OCR with:', {
      model: settings.ocr_model_id,
      fileSize: `${fileSizeMB.toFixed(2)} MB`,
      mimeType: 'application/pdf'
    });
    
    // Make OCR request
    const ocrResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.openrouter_api_key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:10001',
        'X-Title': 'Jose-Otalora Test',
      },
      body: JSON.stringify({
        model: settings.ocr_model_id,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text from this PDF document. Output only the extracted text.'
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
        max_tokens: 4000,
      })
    });
    
    const responseText = await ocrResponse.text();
    console.log('OCR Response:', responseText);
    
    if (!ocrResponse.ok) {
      return NextResponse.json({ 
        error: 'OCR failed', 
        details: responseText,
        model_used: settings.ocr_model_id,
        recommendation: 'If using Gemini, switch to anthropic/claude-3-haiku or openai/gpt-4o-mini'
      }, { status: 400 });
    }
    
    const data = JSON.parse(responseText);
    
    return NextResponse.json({
      success: true,
      model_used: settings.ocr_model_id,
      extracted_text_preview: data.choices?.[0]?.message?.content?.substring(0, 500) + '...',
      full_response: data
    });
    
  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}