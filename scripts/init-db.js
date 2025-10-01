const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database file location
const dbPath = path.join(dataDir, 'jose-otalora.db');

console.log('Initializing database at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Create tables
db.serialize(() => {
  // Create projects table
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      language TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating projects table:', err);
    else console.log('✓ Projects table created');
  });

  // Create documents table
  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      original_filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      processed_markdown_path TEXT,
      processed_html_path TEXT,
      status TEXT DEFAULT 'pending',
      ocr_model TEXT,
      text_model TEXT,
      processing_error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating documents table:', err);
    else console.log('✓ Documents table created');
  });

  // Create settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `, (err) => {
    if (err) console.error('Error creating settings table:', err);
    else console.log('✓ Settings table created');
  });

  // Insert default settings
  db.run(`
    INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('openrouter_api_key', ''),
    ('ocr_model_id', 'google/gemini-flash-1.5-8b'),
    ('text_model_id', 'mistralai/mistral-large-2411')
  `, (err) => {
    if (err) console.error('Error inserting default settings:', err);
    else console.log('✓ Default settings inserted');
  });
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('Database connection closed.');
    console.log('\n✨ Database initialized successfully!');
    console.log('Next steps:');
    console.log('1. Go to http://155.138.165.47:10001/settings');
    console.log('2. Add your OpenRouter API key');
    console.log('3. Start processing documents!');
  }
});