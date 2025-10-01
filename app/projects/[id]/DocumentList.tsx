'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Document {
  id: number;
  original_filename: string;
  file_type: string;
  status: string;
  processing_error?: string;
  created_at: string;
  processed_at?: string;
  processed_markdown_path?: string;
  processed_html_path?: string;
}

interface DocumentListProps {
  documents: Document[];
  projectId: number;
  projectName: string;
}

export default function DocumentList({ documents, projectId, projectName }: DocumentListProps) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleProcessAll = async () => {
    setProcessing(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/process`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      setTimeout(() => {
        router.refresh();
        setProcessing(false);
      }, 3000);
      
    } catch (error) {
      console.error('Processing error:', error);
      alert('Error processing documents. Please check your API settings.');
      setProcessing(false);
    }
  };

  const handleDelete = async (docId: number, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }
    
    setDeleting(docId);
    
    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete document');
    } finally {
      setDeleting(null);
    }
  };

  const pendingDocs = documents.filter(d => d.status === 'pending');

  return (
    <div>
      <div className="sm:flex sm:items-center mb-4">
        <div className="sm:flex-auto">
          <h2 className="text-lg font-medium text-gray-900">Documents</h2>
          <p className="mt-1 text-sm text-gray-500">
            {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
          </p>
        </div>
        {pendingDocs.length > 0 && !processing && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={handleProcessAll}
              disabled={processing}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {processing ? 'Processing...' : `Process ${pendingDocs.length} Document${pendingDocs.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filename
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {doc.original_filename}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.file_type.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                      doc.status === 'completed' ? 'bg-green-100 text-green-800' :
                      doc.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      doc.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {doc.status}
                    </span>
                    {doc.processing_error && (
                      <p className="text-xs text-red-600 mt-1 max-w-xs truncate" title={doc.processing_error}>
                        {doc.processing_error.length > 100 
                          ? doc.processing_error.substring(0, 100) + '...' 
                          : doc.processing_error}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.created_at}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {doc.status === 'completed' && doc.processed_html_path && (
                      <>
                        <a
                          href={`/uploads/${doc.processed_html_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          View HTML
                        </a>
                        <span className="text-gray-400 mr-3">|</span>
                      </>
                    )}
                    {doc.status === 'completed' && doc.processed_markdown_path && (
                      <>
                        <a
                          href={`/uploads/${doc.processed_markdown_path}`}
                          download
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Download MD
                        </a>
                        <span className="text-gray-400 mr-3">|</span>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(doc.id, doc.original_filename)}
                      disabled={deleting === doc.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting === doc.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}