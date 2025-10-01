// Model capabilities and recommendations
export const OCR_MODELS = {
  // Models that support PDF directly
  pdfSupported: [
    'anthropic/claude-3-haiku',
    'anthropic/claude-3-sonnet',
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3-opus',
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'google/gemini-pro-1.5',
    'google/gemini-pro-vision'
  ],
  
  // Models that only support images
  imageOnly: [
    'google/gemini-flash-1.5',
    'google/gemini-flash-1.5-8b',
    'openai/gpt-4-vision-preview'
  ],
  
  // Recommended budget models
  budgetRecommended: {
    pdf: 'anthropic/claude-3-haiku', // $0.25/M tokens, supports PDF
    image: 'google/gemini-flash-1.5-8b' // $0.075/M tokens, image only
  },
  
  // Best quality models
  premiumRecommended: {
    pdf: 'anthropic/claude-3.5-sonnet',
    image: 'openai/gpt-4o'
  }
};

export function getRecommendedModel(fileType: 'pdf' | 'image', budget: boolean = true): string {
  if (fileType === 'pdf') {
    return budget ? OCR_MODELS.budgetRecommended.pdf : OCR_MODELS.premiumRecommended.pdf;
  }
  return budget ? OCR_MODELS.budgetRecommended.image : OCR_MODELS.premiumRecommended.image;
}

export function modelSupportsPDF(modelId: string): boolean {
  return OCR_MODELS.pdfSupported.some(m => modelId.includes(m));
}