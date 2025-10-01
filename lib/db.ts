import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// Database file location
const dbPath = path.join(process.cwd(), 'data', 'jose-otalora.db');

// Initialize database connection
export async function getDb() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

// Initialize database schema
export async function initDb() {
  const db = await getDb();
  
  // Create projects table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      language TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create documents table
  await db.exec(`
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
  `);

  // Create settings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Insert default settings if not exists
  await db.run(`
    INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('openrouter_api_key', ''),
    ('ocr_model_id', 'openai/gpt-4-vision-preview'),
    ('text_model_id', 'openai/gpt-4-turbo-preview')
  `);

  await db.close();
}

// Project operations
export async function createProject(name: string, language: string, description?: string) {
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO projects (name, language, description) VALUES (?, ?, ?)',
    [name, language, description || null]
  );
  await db.close();
  return result.lastID;
}

export async function getProjects() {
  const db = await getDb();
  const projects = await db.all('SELECT * FROM projects ORDER BY created_at DESC');
  await db.close();
  return projects;
}

export async function getProject(id: number) {
  const db = await getDb();
  const project = await db.get('SELECT * FROM projects WHERE id = ?', [id]);
  await db.close();
  return project;
}

// Document operations
export async function createDocument(
  projectId: number,
  originalFilename: string,
  fileType: string,
  filePath: string
) {
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO documents (project_id, original_filename, file_type, file_path) VALUES (?, ?, ?, ?)',
    [projectId, originalFilename, fileType, filePath]
  );
  await db.close();
  return result.lastID;
}

export async function getDocuments(projectId: number) {
  const db = await getDb();
  const documents = await db.all(
    'SELECT * FROM documents WHERE project_id = ? ORDER BY created_at DESC',
    [projectId]
  );
  await db.close();
  return documents;
}

export async function updateDocumentStatus(
  id: number,
  status: string,
  processedMarkdownPath?: string,
  processedHtmlPath?: string,
  error?: string
) {
  const db = await getDb();
  await db.run(
    `UPDATE documents 
     SET status = ?, 
         processed_markdown_path = ?, 
         processed_html_path = ?,
         processing_error = ?,
         processed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE processed_at END
     WHERE id = ?`,
    [status, processedMarkdownPath, processedHtmlPath, error, status, id]
  );
  await db.close();
}

// Delete project and all its documents
export async function deleteProject(projectId: number) {
  const db = await getDb();
  
  try {
    // Start transaction
    await db.run('BEGIN TRANSACTION');
    
    // Delete all documents for this project
    await db.run('DELETE FROM documents WHERE project_id = ?', [projectId]);
    
    // Delete the project
    await db.run('DELETE FROM projects WHERE id = ?', [projectId]);
    
    // Commit transaction
    await db.run('COMMIT');
  } catch (error) {
    // Rollback on error
    await db.run('ROLLBACK');
    throw error;
  } finally {
    await db.close();
  }
}

// Settings operations
export async function getSettings() {
  const db = await getDb();
  const settings = await db.all('SELECT * FROM settings');
  await db.close();
  
  // Convert to object
  const settingsObj: Record<string, string> = {};
  settings.forEach(setting => {
    settingsObj[setting.key] = setting.value;
  });
  return settingsObj;
}

export async function updateSetting(key: string, value: string) {
  const db = await getDb();
  await db.run('UPDATE settings SET value = ? WHERE key = ?', [value, key]);
  await db.close();
}