import PDFMerger from '@/components/PDFMerger';
import Link from 'next/link';

export default function MergePDFsPage() {
  return (
    <div>
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          ← Back to Projects
        </Link>
      </div>
      
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">PDF Merger</h1>
          <p className="mt-2 text-sm text-gray-700">
            Combine multiple PDF documents into a single file for easier management
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <PDFMerger />
        </div>
        
        <div>
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">How it works</h3>
            <ol className="space-y-3 text-sm text-blue-700">
              <li className="flex">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">1</span>
                <span>Select or drag multiple PDF files</span>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">2</span>
                <span>Arrange PDFs in the desired order using arrow buttons</span>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">3</span>
                <span>Click &quot;Merge PDFs&quot; to create a single document</span>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">4</span>
                <span>Download the merged PDF file</span>
              </li>
            </ol>
          </div>
          
          <div className="mt-6 bg-yellow-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-yellow-900 mb-4">Tips</h3>
            <ul className="space-y-2 text-sm text-yellow-700">
              <li>• All pages from each PDF will be included</li>
              <li>• Page order is preserved within each PDF</li>
              <li>• The final PDF maintains original page sizes</li>
              <li>• Bookmarks and metadata are preserved when possible</li>
              <li>• Perfect for combining reports, contracts, or documents</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}