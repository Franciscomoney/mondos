import { PDFDocument, rgb } from 'pdf-lib';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

interface ImageInfo {
  path: string;
  width: number;
  height: number;
  format: string;
}

export async function getImageInfo(imagePath: string): Promise<ImageInfo> {
  const metadata = await sharp(imagePath).metadata();
  return {
    path: imagePath,
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown'
  };
}

export async function mergeImagesToPDF(imagePaths: string[], outputPath: string): Promise<{
  pageCount: number;
  fileSizeMB: number;
  outputPath: string;
}> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  let pageCount = 0;
  
  for (const imagePath of imagePaths) {
    try {
      console.log(`Processing image: ${imagePath}`);
      
      // Read the image file
      const imageBuffer = await fs.readFile(imagePath);
      
      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      const { width = 0, height = 0, format } = metadata;
      
      // Convert to JPEG if needed (PDF embeds JPEG more efficiently)
      let processedImageBuffer = imageBuffer;
      let embedFunction = pdfDoc.embedJpg;
      
      if (format !== 'jpeg') {
        console.log(`Converting ${format} to JPEG for better PDF compression`);
        processedImageBuffer = await sharp(imageBuffer)
          .jpeg({ quality: 85 })
          .toBuffer();
      }
      
      // For PNG images, use embedPng
      if (format === 'png' && imagePath.toLowerCase().endsWith('.png')) {
        embedFunction = pdfDoc.embedPng;
        processedImageBuffer = imageBuffer; // Use original PNG
      }
      
      // Embed the image
      const image = await embedFunction.call(pdfDoc, processedImageBuffer);
      
      // Calculate page size to fit image
      // Standard A4 size in points: 595 x 842
      const maxWidth = 595;
      const maxHeight = 842;
      const padding = 20;
      
      // Calculate scaling to fit within page with padding
      const scaleX = (maxWidth - 2 * padding) / width;
      const scaleY = (maxHeight - 2 * padding) / height;
      const scale = Math.min(scaleX, scaleY, 1); // Don't upscale
      
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      
      // Create a page with appropriate size
      const page = pdfDoc.addPage([maxWidth, maxHeight]);
      
      // Center the image on the page
      const x = (maxWidth - scaledWidth) / 2;
      const y = (maxHeight - scaledHeight) / 2;
      
      // Draw the image
      page.drawImage(image, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
      });
      
      // Add page number
      page.drawText(`Page ${pageCount + 1}`, {
        x: maxWidth / 2 - 20,
        y: 20,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      pageCount++;
    } catch (error) {
      console.error(`Error processing image ${imagePath}:`, error);
      throw new Error(`Failed to process image ${path.basename(imagePath)}: ${error}`);
    }
  }
  
  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(outputPath, pdfBytes);
  
  // Get file size
  const stats = await fs.stat(outputPath);
  const fileSizeMB = stats.size / (1024 * 1024);
  
  console.log(`Created PDF with ${pageCount} pages, size: ${fileSizeMB.toFixed(2)} MB`);
  
  return {
    pageCount,
    fileSizeMB,
    outputPath
  };
}

export async function optimizePDFSize(inputPath: string, outputPath: string): Promise<void> {
  // Read the PDF
  const existingPdfBytes = await fs.readFile(inputPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
  // Save with compression
  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true, // Compress PDF structure
  });
  
  await fs.writeFile(outputPath, pdfBytes);
}