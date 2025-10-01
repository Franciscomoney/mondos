import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const documentId = parseInt(id);
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'markdown';

  try {
    // Get document from database
    const db = await getDb();
    const document = await db.get(
      'SELECT * FROM documents WHERE id = ?',
      [documentId]
    );
    await db.close();

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.status !== 'completed') {
      return NextResponse.json({ error: 'Document not processed yet' }, { status: 400 });
    }

    // Determine file path based on type
    const filePath = type === 'markdown' 
      ? document.processed_markdown_path 
      : document.processed_html_path;

    if (!filePath) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read file
    const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);
    const fileContent = await fs.readFile(fullPath, 'utf-8');

    // Generate filename for download
    const extension = type === 'markdown' ? '.md' : '.html';
    const downloadFilename = path.basename(document.original_filename, path.extname(document.original_filename)) + extension;

    // Return file as download
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': type === 'markdown' ? 'text/markdown' : 'text/html',
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}