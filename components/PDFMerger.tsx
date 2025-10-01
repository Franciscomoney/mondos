'use client';

import { useState, useRef } from 'react';
import { XMarkIcon, ArrowUpIcon, ArrowDownIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface PDFFile {
  id: string;
  file: File;
  name: string;
}

export default function PDFMerger() {
  const [pdfs, setPdfs] = useState<PDFFile[]>([]);
  const [merging, setMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const newPdfs = files.filter(file => file.type === 'application/pdf').map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name
    }));
    
    setPdfs([...pdfs, ...newPdfs]);
    
    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const removePDF = (id: string) => {
    setPdfs(pdfs.filter(pdf => pdf.id !== id));
  };

  const movePDF = (index: number, direction: 'up' | 'down') => {
    const newPdfs = [...pdfs];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < pdfs.length) {
      [newPdfs[index], newPdfs[newIndex]] = [newPdfs[newIndex], newPdfs[index]];
      setPdfs(newPdfs);
    }
  };

  const handleMerge = async () => {
    if (pdfs.length < 2) {
      alert('Please select at least two PDF files to merge');
      return;
    }

    setMerging(true);
    setMergeResult(null);

    try {
      const formData = new FormData();
      pdfs.forEach(pdf => {
        formData.append('pdfs', pdf.file);
      });

      const response = await fetch('/api/merge-pdfs', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to merge PDFs');
      }

      setMergeResult(result);
      
      // Clear PDFs after successful merge
      setPdfs([]);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setMerging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type === 'application/pdf'
    );

    const newPdfs = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name
    }));

    setPdfs([...pdfs, ...newPdfs]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Select PDFs to Merge</h2>
      
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Click to select PDF files or drag and drop
        </p>
        <p className="text-xs text-gray-500 mt-1">
          PDF files only
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {pdfs.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Selected PDFs ({pdfs.length})
          </h3>
          <div className="space-y-2">
            {pdfs.map((pdf, index) => (
              <div
                key={pdf.id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <DocumentIcon className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {pdf.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(pdf.file.size)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => movePDF(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowUpIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => movePDF(index, 'down')}
                    disabled={index === pdfs.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowDownIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removePDF(pdf.id)}
                    className="p-1 text-red-400 hover:text-red-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleMerge}
            disabled={merging || pdfs.length < 2}
            className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {merging ? 'Merging...' : 'Merge PDFs'}
          </button>
        </div>
      )}

      {mergeResult && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h3 className="text-sm font-medium text-green-900 mb-2">
            PDFs Merged Successfully!
          </h3>
          <p className="text-sm text-green-700 mb-3">{mergeResult.message}</p>
          <div className="flex items-center justify-between">
            <div className="text-sm text-green-700">
              <p>Pages: {mergeResult.pageCount}</p>
              <p>Size: {mergeResult.fileSizeMB} MB</p>
            </div>
            <a
              href={mergeResult.path}
              download={mergeResult.filename}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Download PDF
            </a>
          </div>
        </div>
      )}
    </div>
  );
}