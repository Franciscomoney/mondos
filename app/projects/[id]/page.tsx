import { getProject, getDocuments } from '@/lib/db';
import { notFound } from 'next/navigation';
import FileUpload from './FileUpload';
import DocumentList from './DocumentList';
import DeleteProjectButton from './DeleteProjectButton';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = parseInt(id);
  const project = await getProject(projectId);
  
  if (!project) {
    notFound();
  }

  const documents = await getDocuments(projectId);
  
  // Ensure documents are properly serialized
  const serializedDocuments = documents.map((doc: any) => ({
    id: doc.id,
    original_filename: doc.original_filename,
    file_type: doc.file_type,
    status: doc.status,
    processing_error: doc.processing_error || undefined,
    created_at: doc.created_at,
    processed_at: doc.processed_at || undefined,
    processed_markdown_path: doc.processed_markdown_path || undefined,
    processed_html_path: doc.processed_html_path || undefined,
  }));

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Language: {project.language.toUpperCase()} • Created: {new Date(project.created_at).toLocaleDateString()}
            </p>
            {project.description && (
              <p className="mt-2 text-sm text-gray-600">{project.description}</p>
            )}
          </div>
          <DeleteProjectButton projectId={projectId} projectName={project.name} />
        </div>
      </div>

      <div className="mb-8">
        <FileUpload projectId={projectId} projectName={project.name} />
      </div>

      <div>
        <DocumentList 
          documents={serializedDocuments} 
          projectId={projectId} 
          projectName={project.name}
        />
      </div>
    </div>
  );
}