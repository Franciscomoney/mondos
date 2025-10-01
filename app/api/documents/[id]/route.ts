import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const db = await getDb();
    
    // Get document details before deletion
    const document = await db.get(
      'SELECT * FROM documents WHERE id = ?',
      [id]
    );
    
    if (!document) {
      await db.close();
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // Delete associated files
    const filesToDelete = [
      document.file_path,
      document.processed_markdown_path,
      document.processed_html_path
    ].filter(Boolean);
    
    for (const filePath of filesToDelete) {
      try {
        const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);
        await fs.unlink(fullPath);
        console.log(`Deleted file: ${fullPath}`);
      } catch (error) {
        console.error(`Failed to delete file: ${filePath}`, error);
        // Continue even if file deletion fails
      }
    }
    
    // Delete from database
    await db.run('DELETE FROM documents WHERE id = ?', [id]);
    
    // Check if this was the last document in the project
    const remainingDocs = await db.get(
      'SELECT COUNT(*) as count FROM documents WHERE project_id = ?',
      [document.project_id]
    );
    
    await db.close();
    
    return NextResponse.json({ 
      success: true,
      message: 'Document deleted successfully',
      remainingDocuments: remainingDocs.count
    });
    
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}