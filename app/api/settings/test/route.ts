import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { api_key } = await request.json();
    
    if (!api_key) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Test the API key by making a simple request
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${api_key}`,
      },
    });

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      const error = await response.text();
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error testing API key:', error);
    return NextResponse.json({ error: 'Failed to test API key' }, { status: 500 });
  }
}