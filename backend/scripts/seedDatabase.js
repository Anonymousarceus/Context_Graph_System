/**
 * Database Seeding Script
 * Initializes the MongoDB database and indexes
 */

import dotenv from 'dotenv';
import { connectDatabase, initializeDatabase, checkHealth } from '../src/config/database.js';

dotenv.config();

async function seedDatabase() {
  console.log('Connecting to MongoDB...');

  try {
    await connectDatabase();
    console.log('MongoDB connection established!');

    const health = await checkHealth();
    console.log('Connection health:', health.status);

    console.log('Creating indexes...\n');
    await initializeDatabase();

    console.log('\nDatabase initialized successfully!');
    console.log('\nNext steps:');
    console.log('1. Run data ingestion: npm run ingest');
    console.log('2. Start the server: npm run dev');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

seedDatabase();
