import { NextRequest, NextResponse } from 'next/server';
import { convertPDFToMarkdown } from '@/lib/pdf-to-markdown';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const language = formData.get('language') as string | null;
    const modelTier = formData.get('modelTier') as string | null;
    const responseType = formData.get('responseType') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file type. Only PDF files are allowed.' }, { status: 400 });
    }

    const tempDir = path.join(process.cwd(), 'tmp');
    await fs.mkdir(tempDir, { recursive: true });

    const filename = `${Date.now()}-${file.name}`;
    tempFilePath = path.join(tempDir, filename);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(tempFilePath, buffer);

    const result = await convertPDFToMarkdown(tempFilePath, language || undefined, modelTier || 'free');

    if (responseType === 'json') {
      return NextResponse.json({
        markdown: result.markdown,
        pageCount: result.pageCount,
        processingMethod: result.processingMethod
      });
    } else {
      const response = new NextResponse(result.markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': 'attachment; filename="converted.md"',
        },
      });
      
      await fs.unlink(tempFilePath);
      return response;
    }
  } catch (error) {
    console.error('PDF to Markdown conversion error:', error);
    
    return NextResponse.json({ error: 'Failed to convert PDF to Markdown' }, { status: 500 });
  } finally {
    try {
      if (tempFilePath) {
        await fs.unlink(tempFilePath);
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
  }
}