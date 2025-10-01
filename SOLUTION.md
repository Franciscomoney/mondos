# OCR Processing Issue - Solution

## The Problem
The error "Could not process image" with provider "Google" is happening because:

1. **PDF Format Issue**: Claude Haiku expects PDF content in a specific format that differs from image uploads
2. **The model IS set correctly** to `anthropic/claude-3-haiku` but it's failing to process the PDF
3. **Base64 PDF with image_url** format might not be supported by all models

## Solutions

### Option 1: Use OpenAI Models (Recommended for PDFs)
OpenAI models have better PDF support. Change your OCR model to:
- `openai/gpt-4o-mini` (~$0.15/M tokens) - Budget option
- `openai/gpt-4o` (~$3/M tokens) - Premium option

### Option 2: Convert PDF to Images First
If you want to use Claude or Gemini:
1. Convert each PDF page to an image
2. Process each image separately
3. Combine the results

### Option 3: Use a PDF-specific API
Some models require PDFs to be uploaded differently than images.

## Immediate Fix

1. Go to: http://155.138.165.47:10001/settings
2. Change OCR Model to: `openai/gpt-4o-mini`
3. Save settings
4. Try processing again

## Why This Happens

Different models have different capabilities:
- **Gemini Flash**: Images only, no PDF support
- **Claude Haiku**: Limited PDF support via base64
- **OpenAI GPT-4**: Better PDF support, can handle various formats
- **Claude 3.5 Sonnet**: Best quality but more expensive

## Cost Comparison for Your Document

| Model | Cost/M tokens | Est. Cost for 64-page PDF |
|-------|---------------|---------------------------|
| openai/gpt-4o-mini | $0.15 | ~$0.03 |
| anthropic/claude-3-haiku | $0.25 | ~$0.05 |
| openai/gpt-4o | $3.00 | ~$0.60 |