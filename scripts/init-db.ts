import { initDb } from '../lib/db';

async function main() {
  console.log('Initializing database...');
  try {
    await initDb();
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

main();