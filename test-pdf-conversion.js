const fs = require('fs');
const path = require('path');

// Simple test to check if PDF conversion works
async function testPDFConversion() {
  console.log('Testing PDF to Markdown conversion...\n');

  const testPdfPath = path.join(__dirname, 'test.pdf');

  if (!fs.existsSync(testPdfPath)) {
    console.error('❌ Test PDF not found at:', testPdfPath);
    console.log('\nPlease create a test.pdf file in the app directory');
    process.exit(1);
  }

  console.log('✓ Found test PDF at:', testPdfPath);
  console.log('✓ File size:', (fs.statSync(testPdfPath).size / 1024).toFixed(2), 'KB');

  try {
    // Import the conversion function
    const { convertPDFToMarkdown } = require('./lib/pdf-to-markdown.ts');

    console.log('\n🔄 Converting PDF to Markdown...\n');

    const result = await convertPDFToMarkdown(testPdfPath, 'English');

    console.log('✅ Conversion successful!');
    console.log('\n📊 Results:');
    console.log('  - Pages:', result.pageCount);
    console.log('  - Method:', result.processingMethod);
    console.log('  - Markdown length:', result.markdown.length, 'characters');
    console.log('  - Preview:', result.extractedText.substring(0, 200) + '...');
    console.log('\n📝 Full Markdown Output:');
    console.log('─'.repeat(80));
    console.log(result.markdown);
    console.log('─'.repeat(80));

    // Save to file
    const outputPath = path.join(__dirname, 'test-result.md');
    fs.writeFileSync(outputPath, result.markdown);
    console.log('\n💾 Saved to:', outputPath);

  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testPDFConversion();
