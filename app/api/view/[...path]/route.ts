import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const filePath = decodeURIComponent(pathSegments.join('/'));
  
  try {
    // Security: ensure the path is within the uploads directory
    const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);
    const normalizedPath = path.normalize(fullPath);
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!normalizedPath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }
    
    // Check if file exists
    try {
      await fs.access(normalizedPath);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Read the file
    const content = await fs.readFile(normalizedPath, 'utf-8');
    
    // Determine content type
    let contentType = 'text/plain';
    if (normalizedPath.endsWith('.html')) {
      contentType = 'text/html';
    } else if (normalizedPath.endsWith('.md')) {
      contentType = 'text/markdown';
    }
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType + '; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}