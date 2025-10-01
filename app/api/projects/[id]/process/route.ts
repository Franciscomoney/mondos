import { NextRequest, NextResponse } from 'next/server';
import { getProject, getDocuments, updateDocumentStatus } from '@/lib/db';
import { processFileWithOCR } from '@/lib/openrouter';
import { processFileWithEnhancedOCR } from '@/lib/openrouter-enhanced';
import { marked } from 'marked';
import fs from 'fs/promises';
import path from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projectId = parseInt(id);
  
  try {
    // Get project details
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get pending documents
    const documents = await getDocuments(projectId);
    const pendingDocs = documents.filter((doc: any) => doc.status === 'pending');

    if (pendingDocs.length === 0) {
      return NextResponse.json({ message: 'No pending documents to process' });
    }

    const results = [];

    // Process each document
    for (const doc of pendingDocs) {
      try {
        // Update status to processing
        await updateDocumentStatus(doc.id, 'processing');

        // Get full file path
        const fullPath = path.join(process.cwd(), 'public', 'uploads', doc.file_path);
        
        // Process with enhanced OCR for better multi-page support
        const result = await processFileWithEnhancedOCR({
          filePath: fullPath,
          fileType: doc.file_type as 'image' | 'pdf',
          language: project.language,
          isPublicUrl: false,
        });

        // Generate output filenames
        const timestamp = Date.now();
        const baseFilename = path.basename(doc.original_filename, path.extname(doc.original_filename));
        const markdownFilename = `${baseFilename}_${timestamp}.md`;
        const htmlFilename = `${baseFilename}_${timestamp}.html`;

        // Save Markdown file
        const markdownPath = path.join(
          process.cwd(),
          'public',
          'uploads',
          'projects',
          project.name,
          'processed',
          'markdown',
          markdownFilename
        );
        await fs.writeFile(markdownPath, result.markdownContent);

        // Convert Markdown to HTML
        const htmlContent = marked(result.markdownContent);
        const fullHtml = `
<!DOCTYPE html>
<html lang="${project.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${doc.original_filename} - Processed</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background-color: #f9fafb;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            font-weight: 600;
        }
        p {
            margin-bottom: 1rem;
        }
        pre {
            background-color: #f3f4f6;
            padding: 1rem;
            border-radius: 0.375rem;
            overflow-x: auto;
        }
        code {
            background-color: #f3f4f6;
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
            font-size: 0.875rem;
        }
        blockquote {
            border-left: 4px solid #e5e7eb;
            padding-left: 1rem;
            margin-left: 0;
            color: #6b7280;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 1rem;
        }
        th, td {
            border: 1px solid #e5e7eb;
            padding: 0.5rem;
            text-align: left;
        }
        th {
            background-color: #f3f4f6;
            font-weight: 600;
        }
        .metadata {
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
            padding: 1rem;
            margin-bottom: 2rem;
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <div class="metadata">
        <p><strong>Original File:</strong> ${doc.original_filename}</p>
        <p><strong>Processed:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Language:</strong> ${project.language.toUpperCase()}</p>
    </div>
    ${htmlContent}
</body>
</html>`;

        // Save HTML file
        const htmlPath = path.join(
          process.cwd(),
          'public',
          'uploads',
          'projects',
          project.name,
          'processed',
          'html',
          htmlFilename
        );
        await fs.writeFile(htmlPath, fullHtml);

        // Update document status
        await updateDocumentStatus(
          doc.id,
          'completed',
          path.join('projects', project.name, 'processed', 'markdown', markdownFilename),
          path.join('projects', project.name, 'processed', 'html', htmlFilename)
        );

        results.push({
          id: doc.id,
          filename: doc.original_filename,
          status: 'completed',
          usage: result.usage,
          pageCount: result.pageCount,
          processingMethod: result.processingMethod,
        });
      } catch (error: any) {
        console.error(`Error processing document ${doc.id}:`, error);
        
        await updateDocumentStatus(
          doc.id,
          'failed',
          undefined,
          undefined,
          error.message
        );

        results.push({
          id: doc.id,
          filename: doc.original_filename,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process documents' },
      { status: 500 }
    );
  }
}