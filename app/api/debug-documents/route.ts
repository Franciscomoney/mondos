import { NextResponse } from 'next/server';
import { getDocuments } from '@/lib/db';

export async function GET() {
  try {
    const documents = await getDocuments(1); // Project ID 1
    
    return NextResponse.json({
      total: documents.length,
      documents: documents.map((doc: any) => ({
        id: doc.id,
        filename: doc.original_filename,
        status: doc.status,
        has_html_path: !!doc.processed_html_path,
        has_markdown_path: !!doc.processed_markdown_path,
        html_path: doc.processed_html_path,
        markdown_path: doc.processed_markdown_path,
        error: doc.processing_error
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}