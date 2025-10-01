'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

export default function PDFToMarkdownConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [language, setLanguage] = useState('english')
  const [modelTier, setModelTier] = useState('free')
  const [isConverting, setIsConverting] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [error, setError] = useState('')
  const [processingStatus, setProcessingStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile)
        setError('')
      } else {
        setError('Please upload a PDF file')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile)
        setError('')
      } else {
        setError('Please upload a PDF file')
      }
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const convertPDF = async () => {
    if (!file) {
      setError('Please select a PDF file first')
      return
    }

    setIsConverting(true)
    setError('')
    setMarkdown('')
    setProcessingStatus('📤 Uploading document...')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('language', language)
    formData.append('modelTier', modelTier)
    formData.append('responseType', 'json')

    try {
      setProcessingStatus('📄 Extracting text from PDF...')

      const response = await fetch('/api/pdf-to-markdown', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Conversion failed')
      }

      setProcessingStatus('🤖 AI formatting to Markdown...')
      const result = await response.json()

      setProcessingStatus('✅ Complete!')
      setMarkdown(result.markdown)
      setTimeout(() => setProcessingStatus(''), 2000)
    } catch (err: any) {
      setProcessingStatus('❌ Failed')
      setError(err.message || 'Failed to convert PDF. Please try again.')
    } finally {
      setIsConverting(false)
    }
  }

  const downloadMarkdown = () => {
    if (!markdown) return
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file ? `${file.name.replace('.pdf', '')}.md` : 'converted.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 flex items-center">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">PDF to Markdown Converter</h1>
        <p className="text-gray-600 mb-6">Convert your PDF documents to Markdown format</p>

        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <div className="text-gray-500">
            {file ? (
              <p>Selected file: {file.name}</p>
            ) : (
              <>
                <p className="mb-2">Drag and drop your PDF file here</p>
                <p className="text-sm">or click to browse files</p>
              </>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Select Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="english">English</option>
            <option value="spanish">Spanish</option>
            <option value="portuguese">Portuguese</option>
            <option value="german">German</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Processing Speed</label>
          <select
            value={modelTier}
            onChange={(e) => setModelTier(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="free">🆓 Free (slower, for small PDFs)</option>
            <option value="fast">⚡ Fast (~$0.01/doc - Grok-4-Fast)</option>
            <option value="premium">🚀 Premium (~$0.001/doc - Gemini 2.5 Flash)</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            {modelTier === 'free' && 'Best for PDFs under 10 pages. May be slow for larger documents.'}
            {modelTier === 'fast' && 'Fast processing with x-ai/grok-4-fast. Great for medium to large PDFs.'}
            {modelTier === 'premium' && 'Fastest processing with google/gemini-2.5-flash. Best for large PDFs and bulk processing.'}
          </p>
        </div>

        {error && (
          <div className="text-red-500 mb-4 text-center">{error}</div>
        )}

        <button
          onClick={convertPDF}
          disabled={isConverting}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
        >
          {isConverting ? 'Converting...' : 'Convert PDF to Markdown'}
        </button>

        {isConverting && (
          <div className="mt-6">
            <div className="bg-gray-200 rounded-full h-2.5">
              <div className="bg-indigo-600 h-2.5 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
            {processingStatus && (
              <p className="text-indigo-600 text-center mt-3 font-medium">{processingStatus}</p>
            )}
            <p className="text-gray-600 text-center mt-2">Please wait...</p>
          </div>
        )}

        {!isConverting && processingStatus && (
          <div className="mt-4">
            <p className="text-center font-medium">{processingStatus}</p>
          </div>
        )}

        {markdown && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Conversion Result</h2>
              <button
                onClick={downloadMarkdown}
                className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Download Markdown
              </button>
            </div>
            <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
              <pre className="whitespace-pre-wrap text-gray-700">{markdown}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}