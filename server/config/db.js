import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export let isMongoConnected = false;

// Local JSON store fallback path
const dataDir = path.join(__dirname, '..', 'data');
const dbFilePath = path.join(dataDir, 'db.json');

// Ensure data folder exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial JSON DB structure
if (!fs.existsSync(dbFilePath)) {
  const initialData = {
    users: [],
    watchlist: [],
    reviews: []
  };
  fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2));
}

export const getLocalDb = () => {
  try {
    const raw = fs.readFileSync(dbFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local db:', err);
    return { users: [], watchlist: [], reviews: [] };
  }
};

export const saveLocalDb = (data) => {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving local db:', err);
  }
};

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('ℹ️ [Database] No MONGODB_URI provided. Using local persistent storage engine.');
    return;
  }

  console.log(`[Database] Attempting connection to MongoDB...`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    console.log('✨ [MongoDB] Connected successfully to MongoDB database!');
  } catch (error) {
    isMongoConnected = false;
    console.warn(`⚠️ [MongoDB] Local/Remote MongoDB unreachable (${error.message}).`);
    console.log('💾 [Fallback Storage] Seamlessly activated local persistent JSON storage engine.');
    console.log('💡 [Tip] To connect your MongoDB cluster, update MONGODB_URI in `server/.env`.');
  }
};
