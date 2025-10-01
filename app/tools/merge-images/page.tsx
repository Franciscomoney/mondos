import ImageMerger from '@/components/ImageMerger';
import Link from 'next/link';

export default function MergeImagesPage() {
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
          <h1 className="text-2xl font-semibold text-gray-900">Image to PDF Merger</h1>
          <p className="mt-2 text-sm text-gray-700">
            Combine multiple images into a single PDF document for easier processing
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <ImageMerger />
        </div>
        
        <div>
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">How it works</h3>
            <ol className="space-y-3 text-sm text-blue-700">
              <li className="flex">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">1</span>
                <span>Select or drag multiple images (JPG, PNG, GIF)</span>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">2</span>
                <span>Arrange images in the desired order using arrow buttons</span>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">3</span>
                <span>Click &quot;Merge&quot; to create a single PDF document</span>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">4</span>
                <span>Download the PDF or process it with OCR</span>
              </li>
            </ol>
          </div>
          
          <div className="mt-6 bg-yellow-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-yellow-900 mb-4">Tips</h3>
            <ul className="space-y-2 text-sm text-yellow-700">
              <li>• Images are automatically scaled to fit standard A4 pages</li>
              <li>• For best results, use high-resolution images</li>
              <li>• The order of images in the PDF matches the order shown</li>
              <li>• Large images are compressed to reduce PDF size</li>
              <li>• Perfect for combining scanned document pages</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}