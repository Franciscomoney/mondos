import { NextRequest, NextResponse } from 'next/server';
import { mergePDFs } from '@/lib/pdf-merger';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('pdfs') as File[];
    
    if (files.length < 2) {
      return NextResponse.json(
        { error: 'At least two PDF files are required' },
        { status: 400 }
      );
    }
    
    console.log(`Received ${files.length} PDFs to merge`);
    
    // Create temp directory for processing
    const tempDir = path.join(process.cwd(), 'temp', Date.now().toString());
    await fs.mkdir(tempDir, { recursive: true });
    
    const pdfPaths: string[] = [];
    
    try {
      // Save uploaded PDFs to temp directory
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const tempPath = path.join(tempDir, `pdf_${i}.pdf`);
        
        await fs.writeFile(tempPath, buffer);
        pdfPaths.push(tempPath);
        console.log(`Processing PDF: ${tempPath}`);
      }
      
      // Generate output filename
      const timestamp = Date.now();
      const outputFilename = `merged_${timestamp}.pdf`;
      const outputPath = path.join(
        process.cwd(),
        'public',
        'uploads',
        'merged',
        outputFilename
      );
      
      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      // Merge PDFs
      const result = await mergePDFs(pdfPaths, outputPath);
      
      // Clean up temp files
      await fs.rm(tempDir, { recursive: true, force: true });
      
      console.log(`Created merged PDF with ${result.pageCount} pages, size: ${result.fileSizeMB.toFixed(2)} MB`);
      
      return NextResponse.json({
        success: true,
        filename: outputFilename,
        path: `/uploads/merged/${outputFilename}`,
        pageCount: result.pageCount,
        fileSizeMB: result.fileSizeMB.toFixed(2),
        message: `Successfully merged ${files.length} PDFs into a ${result.pageCount}-page document`
      });
      
    } catch (error) {
      // Clean up on error
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
    
  } catch (error: any) {
    console.error('Error merging PDFs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to merge PDFs' },
      { status: 500 }
    );
  }
}