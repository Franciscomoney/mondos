'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteProjectButtonProps {
  projectId: number;
  projectName: string;
}

export default function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
  const router = useRouter();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  const handleDelete = async () => {
    if (confirmText !== projectName) {
      alert('Project name does not match. Please type the exact project name.');
      return;
    }
    
    setDeleting(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
      router.push('/');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete project');
      setDeleting(false);
    }
  };
  
  if (!showConfirmation) {
    return (
      <button
        onClick={() => setShowConfirmation(true)}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Delete Project
      </button>
    );
  }
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <h3 className="text-sm font-medium text-red-800 mb-2">
        Are you absolutely sure?
      </h3>
      <p className="text-sm text-red-700 mb-3">
        This action cannot be undone. This will permanently delete the project
        <span className="font-semibold"> {projectName} </span>
        and all its documents.
      </p>
      <p className="text-sm text-red-700 mb-3">
        Please type <span className="font-mono font-semibold">{projectName}</span> to confirm.
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="Type project name here"
        className="block w-full px-3 py-2 border border-red-300 rounded-md text-sm mb-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
        disabled={deleting}
      />
      <div className="flex space-x-3">
        <button
          onClick={handleDelete}
          disabled={deleting || confirmText !== projectName}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? 'Deleting...' : 'I understand, delete this project'}
        </button>
        <button
          onClick={() => {
            setShowConfirmation(false);
            setConfirmText('');
          }}
          disabled={deleting}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}