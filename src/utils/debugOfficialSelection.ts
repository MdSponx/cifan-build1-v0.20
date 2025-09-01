import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Comprehensive debugging utility for Official Selection Shelf data fetching issues
 */
export const debugOfficialSelectionData = async () => {
  console.log('🔍 DEBUGGING OFFICIAL SELECTION DATA FLOW');
  console.log('==========================================');
  
  try {
    // Step 1: Check raw database data
    console.log('📡 Step 1: Fetching raw data from films collection...');
    const q = query(collection(db, 'films'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    console.log(`📊 Total documents in films collection: ${querySnapshot.size}`);
    
    if (querySnapshot.empty) {
      console.log('⚠️ ISSUE FOUND: Films collection is completely empty!');
      return {
        issue: 'EMPTY_COLLECTION',
        message: 'The films collection contains no documents at all.'
      };
    }
    
    // Step 2: Analyze each document
    const allFilms: any[] = [];
    const publicFilms: any[] = [];
    const draftFilms: any[] = [];
    const noStatusFilms: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const filmData = {
        id: doc.id,
        ...data
      };
      
      allFilms.push(filmData);
      
      // Categorize by publicationStatus
      if (data.publicationStatus === 'public') {
        publicFilms.push(filmData);
      } else if (data.publicationStatus === 'draft') {
        draftFilms.push(filmData);
      } else {
        noStatusFilms.push(filmData);
      }
      
      console.log(`🎬 Film: ${data.titleEn || data.title || 'Untitled'} (${doc.id})`);
      console.log(`   - publicationStatus: ${data.publicationStatus || 'UNDEFINED'}`);
      console.log(`   - status: ${data.status || 'UNDEFINED'}`);
      console.log(`   - createdAt: ${data.createdAt ? 'EXISTS' : 'MISSING'}`);
      console.log(`   - userId: ${data.userId || 'UNDEFINED'}`);
      console.log(`   - createdBy: ${data.createdBy || 'UNDEFINED'}`);
    });
    
    // Step 3: Summary analysis
    console.log('\n📈 SUMMARY ANALYSIS:');
    console.log(`Total films: ${allFilms.length}`);
    console.log(`Films with publicationStatus='public': ${publicFilms.length}`);
    console.log(`Films with publicationStatus='draft': ${draftFilms.length}`);
    console.log(`Films with no publicationStatus: ${noStatusFilms.length}`);
    
    // Step 4: Test the filtering logic
    console.log('\n🔍 Step 4: Testing filtering logic...');
    
    // Simulate the service layer filtering
    const filteredByPublicStatus = allFilms.filter(film => {
      const filmPublicationStatus = film.publicationStatus || (film.status === 'published' ? 'public' : 'draft');
      const matches = filmPublicationStatus === 'public';
      console.log(`   Filter test - ${film.titleEn || film.title}: publicationStatus="${film.publicationStatus}", computed="${filmPublicationStatus}", matches=${matches}`);
      return matches;
    });
    
    console.log(`🎯 Films that should appear in shelf: ${filteredByPublicStatus.length}`);
    
    // Step 5: Test data conversion
    console.log('\n🔄 Step 5: Testing data conversion...');
    
    const convertedFilms: any[] = [];
    filteredByPublicStatus.forEach((film, index) => {
      try {
        // Simulate the convertLegacyToEnhanced function logic
        const isLegacyFormat = !film.files && (film.titleEn || film.posterUrl || film.galleryUrls);
        
        let convertedFilm;
        if (isLegacyFormat) {
          convertedFilm = {
            id: film.id,
            title: film.titleEn || film.title || 'Untitled',
            titleTh: film.titleTh,
            publicationStatus: film.publicationStatus || 'public',
            status: film.status === 'ตอบรับ / Accepted' ? 'published' : 'draft',
            // ... other fields would be mapped here
          };
        } else {
          convertedFilm = {
            id: film.id,
            title: film.title,
            titleTh: film.titleTh,
            publicationStatus: film.publicationStatus || (film.status === 'published' ? 'public' : 'draft'),
            status: film.status,
            // ... other fields would be mapped here
          };
        }
        
        convertedFilms.push(convertedFilm);
        console.log(`   ✅ Successfully converted: ${convertedFilm.title} (${isLegacyFormat ? 'legacy' : 'new'} format)`);
      } catch (error) {
        console.log(`   ❌ Failed to convert film ${index + 1}:`, error);
      }
    });
    
    console.log(`🎬 Successfully converted films: ${convertedFilms.length}`);
    
    // Step 6: Final diagnosis
    console.log('\n🏥 DIAGNOSIS:');
    
    if (publicFilms.length === 0) {
      console.log('❌ ROOT CAUSE: No films have publicationStatus="public"');
      console.log('💡 SOLUTION: Films need to be updated to have publicationStatus="public"');
      
      // Show what films exist and their current status
      console.log('\n📋 Current films and their status:');
      allFilms.forEach(film => {
        console.log(`   - "${film.titleEn || film.title}": publicationStatus="${film.publicationStatus}", status="${film.status}"`);
      });
      
      return {
        issue: 'NO_PUBLIC_FILMS',
        message: 'No films have publicationStatus="public". Films need to be updated.',
        films: allFilms.map(f => ({
          id: f.id,
          title: f.titleEn || f.title,
          publicationStatus: f.publicationStatus,
          status: f.status
        }))
      };
    }
    
    if (filteredByPublicStatus.length === 0) {
      console.log('❌ ROOT CAUSE: Filtering logic is removing all films');
      console.log('💡 SOLUTION: Check the filtering logic in the service layer');
      return {
        issue: 'FILTERING_LOGIC_ERROR',
        message: 'Films exist with publicationStatus="public" but filtering logic is removing them.'
      };
    }
    
    if (convertedFilms.length === 0) {
      console.log('❌ ROOT CAUSE: Data conversion is failing');
      console.log('💡 SOLUTION: Check the convertLegacyToEnhanced function');
      return {
        issue: 'CONVERSION_ERROR',
        message: 'Films pass filtering but fail during data conversion.'
      };
    }
    
    console.log('✅ DATA FLOW LOOKS CORRECT');
    console.log('💡 The issue might be in the React component or hook logic');
    
    return {
      issue: 'COMPONENT_LOGIC_ERROR',
      message: 'Database and service logic appear correct. Issue likely in React component.',
      publicFilms: publicFilms.length,
      convertedFilms: convertedFilms.length
    };
    
  } catch (error) {
    console.error('💥 Error during debugging:', error);
    return {
      issue: 'DEBUG_ERROR',
      message: `Error during debugging: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Quick check for films with public status
 */
export const quickCheckPublicFilms = async () => {
  try {
    const q = query(collection(db, 'films'));
    const querySnapshot = await getDocs(q);
    
    const publicFilms: Array<{
      id: string;
      title: string;
      publicationStatus: string;
      status: string;
    }> = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.publicationStatus === 'public') {
        publicFilms.push({
          id: doc.id,
          title: data.titleEn || data.title,
          publicationStatus: data.publicationStatus,
          status: data.status
        });
      }
    });
    
    console.log(`🎬 Found ${publicFilms.length} films with publicationStatus='public':`);
    publicFilms.forEach(film => {
      console.log(`   - ${film.title} (${film.id})`);
    });
    
    return publicFilms;
  } catch (error) {
    console.error('Error checking public films:', error);
    return [];
  }
};

// Export for browser console access
if (typeof window !== 'undefined') {
  (window as any).debugOfficialSelectionData = debugOfficialSelectionData;
  (window as any).quickCheckPublicFilms = quickCheckPublicFilms;
}
