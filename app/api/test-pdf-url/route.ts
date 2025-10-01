import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export async function GET() {
  try {
    const settings = await getSettings();
    
    // Try with a direct URL approach
    const pdfUrl = 'http://155.138.165.47:10001/uploads/projects/presidente-jose-otalora/uploads/1756640880729_cartapresidente.pdf';
    
    console.log('Testing URL-based OCR with:', {
      model: settings.ocr_model_id,
      url: pdfUrl
    });
    
    // Try different content formats
    const attempts = [
      {
        name: 'Direct text request',
        content: `Please extract all text from this PDF document: ${pdfUrl}`
      },
      {
        name: 'URL in message',
        content: [
          {
            type: 'text',
            text: `Extract all text from the PDF at this URL: ${pdfUrl}`
          }
        ]
      }
    ];
    
    const results = [];
    
    for (const attempt of attempts) {
      try {
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
                content: attempt.content
              }
            ],
            temperature: 0.1,
            max_tokens: 4000,
          })
        });
        
        const data = await ocrResponse.json();
        
        results.push({
          attempt: attempt.name,
          success: ocrResponse.ok,
          response: data.choices?.[0]?.message?.content?.substring(0, 200) + '...' || data.error
        });
      } catch (error: any) {
        results.push({
          attempt: attempt.name,
          success: false,
          error: error.message
        });
      }
    }
    
    return NextResponse.json({
      model_used: settings.ocr_model_id,
      pdf_url: pdfUrl,
      results,
      recommendation: 'Claude models need file content, not URLs. Consider using OpenAI models which can fetch URLs directly.'
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}