import { NextResponse } from 'next/server';
import { getDocuments } from '@/lib/db';

export async function GET() {
  const documents = await getDocuments(1);
  
  return NextResponse.json({
    documents: documents.map((doc: any) => ({
      ...doc,
      condition1: doc.status === 'completed',
      condition2: !!doc.processed_html_path,
      fullCondition: doc.status === 'completed' && doc.processed_html_path
    }))
  });
}