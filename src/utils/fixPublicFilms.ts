import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Simple utility to fix public access to feature films
 */
export const fixPublicFilmsAccess = async () => {
  console.log('🔧 FIXING PUBLIC FILMS ACCESS');
  console.log('==============================');
  
  try {
    // Step 1: Get all films from database
    console.log('📡 Fetching all films...');
    const q = query(collection(db, 'films'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    console.log(`📊 Found ${querySnapshot.size} films in database`);
    
    if (querySnapshot.empty) {
      console.log('⚠️ No films found in database');
      return { success: false, message: 'No films found in database' };
    }
    
    // Step 2: Check current status and update films that should be public
    const filmsToUpdate: any[] = [];
    const publicFilms: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const filmData = {
        id: doc.id,
        title: data.titleEn || data.title || 'Untitled',
        publicationStatus: data.publicationStatus,
        status: data.status,
        ...data
      };
      
      console.log(`🎬 Film: "${filmData.title}"`);
      console.log(`   - publicationStatus: ${filmData.publicationStatus || 'UNDEFINED'}`);
      console.log(`   - status: ${filmData.status || 'UNDEFINED'}`);
      
      // Check if film is already public
      if (filmData.publicationStatus === 'public') {
        publicFilms.push(filmData);
        console.log(`   ✅ Already public`);
      } else {
        // Mark for update if it should be public
        // Update films that have accepted status or are published
        if (filmData.status === 'ตอบรับ / Accepted' || 
            filmData.status === 'published' ||
            filmData.status === 'Published') {
          filmsToUpdate.push(filmData);
          console.log(`   🔄 Will update to public`);
        } else {
          console.log(`   ⏸️ Keeping as draft (status: ${filmData.status})`);
        }
      }
    });
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`Films already public: ${publicFilms.length}`);
    console.log(`Films to update: ${filmsToUpdate.length}`);
    
    // Step 3: Update films to public status
    if (filmsToUpdate.length > 0) {
      console.log(`\n🔄 Updating ${filmsToUpdate.length} films to public status...`);
      
      const updatePromises = filmsToUpdate.map(async (film) => {
        try {
          const filmRef = doc(db, 'films', film.id);
          await updateDoc(filmRef, {
            publicationStatus: 'public'
          });
          console.log(`✅ Updated "${film.title}" to public`);
          return { success: true, filmId: film.id, title: film.title };
        } catch (error) {
          console.error(`❌ Failed to update "${film.title}":`, error);
          return { success: false, filmId: film.id, title: film.title, error };
        }
      });
      
      const results = await Promise.all(updatePromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      console.log(`\n🎉 UPDATE COMPLETE:`);
      console.log(`Successfully updated: ${successful.length} films`);
      console.log(`Failed to update: ${failed.length} films`);
      
      if (failed.length > 0) {
        console.log(`❌ Failed films:`, failed.map(f => f.title));
      }
      
      return {
        success: true,
        message: `Updated ${successful.length} films to public status`,
        totalPublicFilms: publicFilms.length + successful.length,
        updatedFilms: successful.length,
        failedUpdates: failed.length
      };
    } else {
      console.log(`\n✅ No films need updating`);
      return {
        success: true,
        message: `${publicFilms.length} films are already public`,
        totalPublicFilms: publicFilms.length,
        updatedFilms: 0,
        failedUpdates: 0
      };
    }
    
  } catch (error) {
    console.error('💥 Error fixing public films access:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Quick check to see current public films
 */
export const checkPublicFilms = async () => {
  try {
    console.log('🔍 CHECKING PUBLIC FILMS');
    console.log('========================');
    
    const q = query(collection(db, 'films'));
    const querySnapshot = await getDocs(q);
    
    const publicFilms: any[] = [];
    const allFilms: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const filmData = {
        id: doc.id,
        title: data.titleEn || data.title || 'Untitled',
        publicationStatus: data.publicationStatus,
        status: data.status
      };
      
      allFilms.push(filmData);
      
      if (data.publicationStatus === 'public') {
        publicFilms.push(filmData);
      }
    });
    
    console.log(`📊 Total films: ${allFilms.length}`);
    console.log(`🌍 Public films: ${publicFilms.length}`);
    
    if (publicFilms.length > 0) {
      console.log(`\n✅ Public films found:`);
      publicFilms.forEach(film => {
        console.log(`   - "${film.title}" (${film.id})`);
      });
    } else {
      console.log(`\n⚠️ No public films found`);
      console.log(`📋 All films status:`);
      allFilms.forEach(film => {
        console.log(`   - "${film.title}": publicationStatus="${film.publicationStatus}", status="${film.status}"`);
      });
    }
    
    return {
      totalFilms: allFilms.length,
      publicFilms: publicFilms.length,
      films: allFilms
    };
    
  } catch (error) {
    console.error('Error checking public films:', error);
    return { totalFilms: 0, publicFilms: 0, films: [] };
  }
};

// Export for browser console access
if (typeof window !== 'undefined') {
  (window as any).fixPublicFilmsAccess = fixPublicFilmsAccess;
  (window as any).checkPublicFilms = checkPublicFilms;
}
