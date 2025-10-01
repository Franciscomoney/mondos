'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';

interface FileUploadProps {
  projectId: number;
  projectName: string;
}

export default function FileUpload({ projectId, projectName }: FileUploadProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    const progress: Record<string, number> = {};
    
    for (const file of acceptedFiles) {
      progress[file.name] = 0;
      setUploadProgress({ ...progress });

      // Show uploading message
      progress[file.name] = 1; // Start at 1% to show uploading
      setUploadProgress({ ...progress });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId.toString());
      formData.append('projectName', projectName);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        progress[file.name] = 100;
        setUploadProgress({ ...progress });
      } catch (error) {
        console.error('Upload error:', error);
        progress[file.name] = -1; // Mark as failed
        setUploadProgress({ ...progress });
      }
    }

    setTimeout(() => {
      setUploading(false);
      setUploadProgress({});
      router.refresh();
    }, 1000);
  }, [projectId, projectName, router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
    maxFiles: 20,
  });

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Documents</h2>
      
      <div
        {...getRootProps()}
        className={`relative block w-full rounded-lg border-2 border-dashed p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input {...getInputProps()} disabled={uploading} />
        
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        
        <span className="mt-2 block text-sm font-medium text-gray-900">
          {isDragActive ? 'Drop files here' : 'Drop files here or click to browse'}
        </span>
        
        <p className="mt-1 text-xs text-gray-500">
          JPG, PNG, GIF, WEBP, PDF up to 50MB • Max 20 files at once
        </p>
      </div>

      {uploading && Object.keys(uploadProgress).length > 0 && (
        <div className="mt-4 space-y-2">
          {Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 truncate">{filename}</span>
                <span className="text-sm text-gray-500">
                  {progress === -1 ? 'Failed' : progress === 100 ? 'Complete' : progress < 50 ? 'Uploading document...' : `${progress}%`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    progress === -1 ? 'bg-red-600' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.max(progress, 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}