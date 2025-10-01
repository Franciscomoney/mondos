import { NextRequest, NextResponse } from 'next/server';
import { createProject, getProjects } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const projects = await getProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, language, description } = body;

    if (!name || !language) {
      return NextResponse.json(
        { error: 'Name and language are required' },
        { status: 400 }
      );
    }

    // Create project in database
    const projectId = await createProject(name, language, description);

    // Create project directory structure
    const projectDir = path.join(process.cwd(), 'public', 'uploads', 'projects', name);
    const uploadsDir = path.join(projectDir, 'uploads');
    const processedDir = path.join(projectDir, 'processed');
    const markdownDir = path.join(processedDir, 'markdown');
    const htmlDir = path.join(processedDir, 'html');

    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(markdownDir, { recursive: true });
    await fs.mkdir(htmlDir, { recursive: true });

    // Save project metadata
    const metadata = {
      id: projectId,
      name,
      language,
      description,
      created_at: new Date().toISOString(),
    };

    await fs.writeFile(
      path.join(projectDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}