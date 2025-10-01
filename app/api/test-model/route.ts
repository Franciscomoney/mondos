import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export async function GET() {
  try {
    const settings = await getSettings();
    
    return NextResponse.json({
      message: 'Current OCR settings',
      settings: {
        ocr_model: settings.ocr_model_id,
        text_model: settings.text_model_id,
        has_api_key: !!settings.openrouter_api_key
      },
      recommendations: {
        pdf_compatible_models: [
          'anthropic/claude-3-haiku',
          'anthropic/claude-3.5-sonnet',
          'openai/gpt-4o',
          'openai/gpt-4o-mini'
        ],
        image_only_models: [
          'google/gemini-flash-1.5-8b',
          'google/gemini-flash-1.5'
        ]
      },
      current_issue: settings.ocr_model_id?.includes('gemini') ? 
        'WARNING: Gemini models do NOT support PDF files! Please change to a PDF-compatible model.' : 
        'Model should support PDFs'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}