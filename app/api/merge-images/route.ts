import { NextRequest, NextResponse } from 'next/server';
import { mergeImagesToPDF } from '@/lib/image-merger';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }
    
    console.log(`Received ${files.length} images to merge`);
    
    // Create temp directory for processing
    const tempDir = path.join(process.cwd(), 'temp', Date.now().toString());
    await fs.mkdir(tempDir, { recursive: true });
    
    const imagePaths: string[] = [];
    
    try {
      // Save uploaded images to temp directory
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Get file extension
        const ext = path.extname(file.name) || '.jpg';
        const tempPath = path.join(tempDir, `image_${i}${ext}`);
        
        await fs.writeFile(tempPath, buffer);
        imagePaths.push(tempPath);
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
      
      // Merge images into PDF
      const result = await mergeImagesToPDF(imagePaths, outputPath);
      
      // Clean up temp files
      await fs.rm(tempDir, { recursive: true, force: true });
      
      return NextResponse.json({
        success: true,
        filename: outputFilename,
        path: `/uploads/merged/${outputFilename}`,
        pageCount: result.pageCount,
        fileSizeMB: result.fileSizeMB.toFixed(2),
        message: `Successfully merged ${files.length} images into a ${result.pageCount}-page PDF`
      });
      
    } catch (error) {
      // Clean up on error
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
    
  } catch (error: any) {
    console.error('Error merging images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to merge images' },
      { status: 500 }
    );
  }
}