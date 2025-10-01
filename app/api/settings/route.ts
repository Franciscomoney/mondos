import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSetting } from '@/lib/db';

export async function GET() {
  try {
    const settings = await getSettings();
    
    // Mask the API key if it exists
    if (settings.openrouter_api_key && settings.openrouter_api_key.length > 0) {
      settings.openrouter_api_key = '••••••••••••••••';
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Update only the settings that were provided
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string' && value !== '') {
        // Don't update if it's the masked value
        if (key === 'openrouter_api_key' && value.includes('•')) {
          continue;
        }
        await updateSetting(key, value);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}