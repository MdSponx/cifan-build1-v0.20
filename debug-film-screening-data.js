import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase config from src/firebase.ts
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

async function debugFilmScreeningData() {
  try {
    console.log('🔍 Fetching all feature films to check screening data...');
    
    const filmsRef = collection(db, 'featureFilms');
    const snapshot = await getDocs(filmsRef);
    
    console.log(`📊 Found ${snapshot.size} films in database`);
    
    snapshot.forEach((doc) => {
      const film = doc.data();
      console.log(`\n🎬 Film: "${film.title || film.titleEn}"`);
      console.log('  ID:', doc.id);
      console.log('  Status:', film.status);
      console.log('  Publication Status:', film.publicationStatus);
      console.log('  Screening Date 1:', film.screeningDate1);
      console.log('  Screening Date 2:', film.screeningDate2);
      console.log('  Time Estimate:', film.timeEstimate);
      console.log('  Theatre:', film.theatre);
      console.log('  Length:', film.length || film.Length);
      console.log('  Duration:', film.duration);
      
      // Check if it has proper screening data
      if (film.screeningDate1) {
        const date = new Date(film.screeningDate1);
        console.log('  ✅ Has screeningDate1:', date.toISOString());
        console.log('  ⏰ Extracted time:', `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`);
      } else {
        console.log('  ❌ No screeningDate1');
      }
      
      if (film.screeningDate2) {
        const date = new Date(film.screeningDate2);
        console.log('  ✅ Has screeningDate2:', date.toISOString());
        console.log('  ⏰ Extracted time:', `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`);
      }
      
      // Check if it would use fallback
      if (!film.screeningDate1 && !film.screeningDate2 && film.timeEstimate) {
        console.log('  🔄 Would use fallback with timeEstimate:', film.timeEstimate);
        const timeMap = {
          'เช้า': '10:00',
          'บ่าย': '14:00',
          'ค่ำ': '19:00',
          'กลางคืน': '22:00'
        };
        console.log('  🕐 Fallback time would be:', timeMap[film.timeEstimate] || '19:00');
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching film data:', error);
  }
}

debugFilmScreeningData();
