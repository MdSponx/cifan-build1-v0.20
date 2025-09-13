// Test script to run the migration for adding userId to existing submissions
// Run this with: node test-migration.js

const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { migrateSubmissionsAddUserId } = require('./src/utils/migrationUtils');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC6vE7oxN7j1bF8L8Jv9QH8xJQ8JQ8JQ8J",
  authDomain: "cifan-c41c6.firebaseapp.com",
  projectId: "cifan-c41c6",
  storageBucket: "cifan-c41c6.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runMigration() {
  try {
    console.log('Starting migration test...');
    await migrateSubmissionsAddUserId();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();
