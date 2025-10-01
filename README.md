This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## MONDOS - Francisco Money Documents Systems

**Project conceived, created and designed by Francisco Cordoba Otalora.**

I built this project to help me in all the process of converting files in the easiest possible way. That's why it includes multiple functionalities:

1. **PDF Merger** - Combine multiple PDF documents into a single file for easier management
2. **Image to PDF** - Convert and merge multiple images (JPG, PNG, GIF) into a single PDF document
3. **PDF to Markdown** - Extract and format text from multi-page PDFs into clean Markdown, perfect for LLMs
4. **Project Management** - Organize digitization projects with language support (English, Spanish, Portuguese, German)

The goal is to make document conversion seamless, whether you're merging files, converting images, or preparing documents for AI processing.

### How PDF to Markdown Conversion Works

When you upload a PDF, the system first uses **pdf.js** (a JavaScript PDF rendering library) to extract all the embedded text from every page of the document. This happens quickly - for a 19-page PDF, it can extract 81,787 characters in just a few seconds. The text extraction doesn't use OCR or vision models; it simply reads the text data that's already embedded in the PDF file, which is why it's fast and accurate.

After extracting the raw text, the system sends it to an **AI language model** (Google Gemini or Claude) via OpenRouter API to format it into clean Markdown. The AI analyzes the text structure to identify titles, sections, lists, and paragraphs, then applies proper Markdown formatting (# for headers, ** for bold, - for lists, etc.). This AI formatting step is what takes the most time - for large documents like a 19-page PDF, it takes about 4 minutes because the model needs to read, understand, and reformat all 81,787 characters. The final result is clean, well-structured Markdown that preserves the document's hierarchy and formatting.

### Features

- **PDF to Markdown Conversion**: Extract and format text from multi-page PDFs
- **Language Support**: English, Spanish, Portuguese, and German
- **Image Merging**: Combine multiple images into a single file
- **PDF Merging**: Merge multiple PDF documents
- **Project Management**: Organize digitization projects

### Performance

- Small PDFs (1-5 pages): ~30-60 seconds
- Medium PDFs (6-15 pages): 1-3 minutes
- Large PDFs (16-40 pages): 3-5 minutes

Processing time depends on document size and AI model availability.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
