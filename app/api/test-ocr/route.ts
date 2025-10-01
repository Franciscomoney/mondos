import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { image, filename } = await request.json();
    const settings = await getSettings();
    
    if (!settings.openrouter_api_key) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 400 });
    }
    
    console.log('Testing OCR with:', filename);
    console.log('Image data length:', image.length);
    console.log('Using model:', settings.ocr_model_id);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.openrouter_api_key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:10001',
        'X-Title': 'Jose-Otalora OCR Test',
      },
      body: JSON.stringify({
        model: settings.ocr_model_id,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text from this image. Just output the text you see, nothing else.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      })
    });
    
    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', responseText);
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'API request failed', 
        status: response.status,
        details: responseText 
      }, { status: response.status });
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json({ 
        error: 'Invalid JSON response', 
        response: responseText 
      }, { status: 500 });
    }
    
    if (data.error) {
      return NextResponse.json({ 
        error: 'API error', 
        details: data.error 
      }, { status: 400 });
    }
    
    const extractedText = data.choices?.[0]?.message?.content || 'No text extracted';
    
    return NextResponse.json({
      success: true,
      text: extractedText,
      model: settings.ocr_model_id,
      usage: data.usage
    });
    
  } catch (error: any) {
    console.error('Test OCR error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}