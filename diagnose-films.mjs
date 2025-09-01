// Simple Node.js script to diagnose public films issue
// Run with: node diagnose-films.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';

// Firebase configuration (from your project)
const firebaseConfig = {
  apiKey: "AIzaSyDzDuGiiL5RfqE1y1kLQp16RQPnYJbWw_I",
  authDomain: "cifan-c41c6.firebaseapp.com",
  projectId: "cifan-c41c6",
  storageBucket: "cifan-c41c6.firebasestorage.app",
  messagingSenderId: "789354543255",
  appId: "1:789354543255:web:4506a0d3f2b5ff97e491d2",
  measurementId: "G-EFSKHEYFWC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkFilmsCollection() {
  try {
    console.log('🔍 Checking films collection...');
    
    const filmsRef = collection(db, 'films');
    const snapshot = await getDocs(filmsRef);
    
    if (snapshot.empty) {
      console.log('❌ Films collection is empty');
      return { success: false, count: 0 };
    }
    
    const films = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      films.push({
        id: doc.id,
        title: data.titleEn || data.title || 'Untitled',
        publicationStatus: data.publicationStatus,
        status: data.status,
        createdAt: data.createdAt
      });
    });
    
    console.log(`✅ Found ${films.length} films in collection`);
    console.log('📋 Films:', films);
    
    return { success: true, count: films.length, films };
  } catch (error) {
    console.error('❌ Error checking films collection:', error.message);
    return { success: false, error: error.message };
  }
}

async function checkPublicFilms() {
  try {
    console.log('🔍 Checking for public films...');
    
    const filmsRef = collection(db, 'films');
    const publicQuery = query(
      filmsRef,
      where('publicationStatus', '==', 'public')
    );
    
    const snapshot = await getDocs(publicQuery);
    
    if (snapshot.empty) {
      console.log('❌ No films found with publicationStatus: "public"');
      return { success: false, count: 0 };
    }
    
    const publicFilms = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      publicFilms.push({
        id: doc.id,
        title: data.titleEn || data.title || 'Untitled',
        publicationStatus: data.publicationStatus,
        status: data.status,
        director: data.director
      });
    });
    
    console.log(`✅ Found ${publicFilms.length} public films`);
    console.log('📋 Public films:', publicFilms);
    
    return { success: true, count: publicFilms.length, films: publicFilms };
  } catch (error) {
    console.error('❌ Error checking public films:', error.message);
    return { success: false, error: error.message };
  }
}

async function analyzeFilmStatuses() {
  try {
    console.log('🔍 Analyzing film status distribution...');
    
    const filmsRef = collection(db, 'films');
    const snapshot = await getDocs(filmsRef);
    
    if (snapshot.empty) {
      console.log('❌ No films to analyze');
      return { success: false };
    }
    
    const analysis = {
      totalFilms: snapshot.size,
      hasPublicationStatus: 0,
      missingPublicationStatus: 0,
      publicationStatusValues: {},
      statusValues: {},
      filmDetails: []
    };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      if (data.publicationStatus) {
        analysis.hasPublicationStatus++;
        analysis.publicationStatusValues[data.publicationStatus] = 
          (analysis.publicationStatusValues[data.publicationStatus] || 0) + 1;
      } else {
        analysis.missingPublicationStatus++;
      }
      
      if (data.status) {
        analysis.statusValues[data.status] = 
          (analysis.statusValues[data.status] || 0) + 1;
      }
      
      analysis.filmDetails.push({
        id: doc.id,
        title: data.titleEn || data.title || 'Untitled',
        publicationStatus: data.publicationStatus || 'MISSING',
        status: data.status || 'MISSING'
      });
    });
    
    console.log('✅ Analysis complete:');
    console.log('📊 Total films:', analysis.totalFilms);
    console.log('📊 Films with publicationStatus:', analysis.hasPublicationStatus);
    console.log('📊 Films missing publicationStatus:', analysis.missingPublicationStatus);
    console.log('📊 PublicationStatus distribution:', analysis.publicationStatusValues);
    console.log('📊 Status distribution:', analysis.statusValues);
    console.log('📋 Film details:', analysis.filmDetails);
    
    return { success: true, data: analysis };
  } catch (error) {
    console.error('❌ Error analyzing film statuses:', error.message);
    return { success: false, error: error.message };
  }
}

async function runDiagnostics() {
  console.log('🚀 Starting public films diagnostics...');
  console.log('='.repeat(60));
  
  // Check if films exist
  const collectionResult = await checkFilmsCollection();
  
  if (!collectionResult.success) {
    console.log('\n🚨 ISSUE: No films exist in the database');
    console.log('💡 SOLUTION: Create test films or import existing films');
    return;
  }
  
  // Check for public films
  const publicResult = await checkPublicFilms();
  
  if (!publicResult.success) {
    console.log('\n🚨 ISSUE: No films have publicationStatus: "public"');
    console.log('💡 SOLUTION: Update existing films to set publicationStatus: "public"');
    
    // Analyze current status distribution
    await analyzeFilmStatuses();
  } else {
    console.log('\n✅ Public films found! The issue may be elsewhere.');
  }
  
  console.log('\n🎉 Diagnostics complete!');
}

// Run diagnostics
runDiagnostics().catch(console.error);
