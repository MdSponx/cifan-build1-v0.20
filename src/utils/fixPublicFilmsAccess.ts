import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Utility to test and fix public films access issue
 * This will help identify the exact problem with data structure conversion
 */

export interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Test direct access to films with publicationStatus: 'public'
 */
export const testDirectPublicAccess = async (): Promise<TestResult> => {
  try {
    console.log('🔍 Testing direct access to public films...');
    
    const filmsRef = collection(db, 'films');
    const publicQuery = query(
      filmsRef,
      where('publicationStatus', '==', 'public')
    );
    
    const snapshot = await getDocs(publicQuery);
    
    if (snapshot.empty) {
      return {
        success: false,
        message: 'No films found with publicationStatus: "public"',
        data: { count: 0 }
      };
    }
    
    const publicFilms: any[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      publicFilms.push({
        id: doc.id,
        titleEn: data.titleEn,
        title: data.title,
        publicationStatus: data.publicationStatus,
        status: data.status,
        director: data.director,
        posterUrl: data.posterUrl,
        galleryUrls: data.galleryUrls?.length || 0,
        hasFiles: !!data.files
      });
    });
    
    console.log('✅ Found public films:', publicFilms);
    
    return {
      success: true,
      message: `Found ${publicFilms.length} public films`,
      data: {
        count: publicFilms.length,
        films: publicFilms,
        sampleFilm: publicFilms[0]
      }
    };
  } catch (error) {
    console.error('❌ Error testing direct public access:', error);
    return {
      success: false,
      message: 'Error accessing public films',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Test the legacy to enhanced conversion process
 */
export const testLegacyConversion = async (): Promise<TestResult> => {
  try {
    console.log('🔍 Testing legacy to enhanced conversion...');
    
    const filmsRef = collection(db, 'films');
    const publicQuery = query(
      filmsRef,
      where('publicationStatus', '==', 'public')
    );
    
    const snapshot = await getDocs(publicQuery);
    
    if (snapshot.empty) {
      return {
        success: false,
        message: 'No public films to test conversion'
      };
    }
    
    const conversionResults: any[] = [];
    
    snapshot.forEach(doc => {
      const legacyData = doc.data();
      
      try {
        // Simulate the conversion logic from featureFilmService.ts
        const convertedFilm = {
          id: doc.id,
          title: legacyData.titleEn || legacyData.title || 'Untitled',
          titleTh: legacyData.titleTh,
          director: legacyData.director || 'Unknown',
          duration: legacyData.length || legacyData.duration || 120,
          releaseYear: legacyData.releaseYear || new Date().getFullYear(),
          country: Array.isArray(legacyData.countries) && legacyData.countries.length > 0 
            ? legacyData.countries[0] 
            : (legacyData.country || 'Unknown'),
          language: Array.isArray(legacyData.languages) && legacyData.languages.length > 0
            ? legacyData.languages
            : (legacyData.language ? [legacyData.language] : ['Unknown']),
          genres: Array.isArray(legacyData.genres) ? legacyData.genres : [],
          publicationStatus: legacyData.publicationStatus,
          status: legacyData.publicationStatus === 'public' ? 'published' : 'draft',
          files: {
            poster: legacyData.posterUrl ? {
              url: legacyData.posterUrl,
              name: 'poster',
              size: 0,
              type: 'image/jpeg'
            } : undefined,
            stills: legacyData.galleryUrls && legacyData.galleryUrls.length > 0 ? 
              legacyData.galleryUrls.map((url: string, index: number) => ({
                url,
                name: `still_${index + 1}`,
                size: 0,
                type: 'image/jpeg'
              })) : undefined
          }
        };
        
        conversionResults.push({
          id: doc.id,
          original: {
            titleEn: legacyData.titleEn,
            publicationStatus: legacyData.publicationStatus,
            hasGalleryUrls: !!legacyData.galleryUrls,
            hasPosterUrl: !!legacyData.posterUrl
          },
          converted: {
            title: convertedFilm.title,
            publicationStatus: convertedFilm.publicationStatus,
            status: convertedFilm.status,
            hasPosterFile: !!convertedFilm.files.poster,
            hasStillsFiles: !!convertedFilm.files.stills
          },
          conversionSuccess: true
        });
        
      } catch (conversionError) {
        conversionResults.push({
          id: doc.id,
          conversionSuccess: false,
          error: conversionError instanceof Error ? conversionError.message : 'Unknown conversion error'
        });
      }
    });
    
    console.log('✅ Conversion test results:', conversionResults);
    
    return {
      success: true,
      message: `Tested conversion for ${conversionResults.length} films`,
      data: {
        results: conversionResults,
        successfulConversions: conversionResults.filter(r => r.conversionSuccess).length,
        failedConversions: conversionResults.filter(r => !r.conversionSuccess).length
      }
    };
    
  } catch (error) {
    console.error('❌ Error testing legacy conversion:', error);
    return {
      success: false,
      message: 'Error testing legacy conversion',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Run comprehensive tests to identify the exact issue
 */
export const runPublicFilmsTests = async (): Promise<void> => {
  console.log('🚀 Starting comprehensive public films access tests...');
  console.log('=' .repeat(60));
  
  // Test 1: Direct access to public films
  console.log('\n📋 Test 1: Direct Public Films Access');
  const directAccessResult = await testDirectPublicAccess();
  
  if (directAccessResult.success) {
    console.log(`✅ ${directAccessResult.message}`);
    console.log('📊 Sample film data:', directAccessResult.data?.sampleFilm);
  } else {
    console.error(`❌ ${directAccessResult.message}`);
    if (directAccessResult.error) {
      console.error('🔥 Error:', directAccessResult.error);
    }
    return; // Can't continue without films
  }
  
  // Test 2: Legacy to Enhanced conversion
  console.log('\n📋 Test 2: Legacy to Enhanced Conversion');
  const conversionResult = await testLegacyConversion();
  
  if (conversionResult.success) {
    console.log(`✅ ${conversionResult.message}`);
    console.log('📊 Conversion stats:', {
      successful: conversionResult.data?.successfulConversions,
      failed: conversionResult.data?.failedConversions
    });
    
    if (conversionResult.data?.failedConversions > 0) {
      console.log('❌ Failed conversions:', 
        conversionResult.data.results.filter((r: any) => !r.conversionSuccess)
      );
    }
  } else {
    console.error(`❌ ${conversionResult.message}`);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 DIAGNOSIS SUMMARY');
  console.log('=' .repeat(60));
  
  if (directAccessResult.success && conversionResult.success) {
    if (conversionResult.data?.failedConversions === 0) {
      console.log('✅ Films exist and conversion works properly');
      console.log('🔍 The issue may be in the frontend component or service layer');
      console.log('💡 Check the useFeatureFilms hook and PublicFeatureFilmsPage component');
    } else {
      console.log('🚨 ISSUE: Some films fail during legacy-to-enhanced conversion');
      console.log('💡 SOLUTION: Fix the conversion logic in featureFilmService.ts');
    }
  } else {
    console.log('🚨 ISSUE: Cannot access public films from database');
    console.log('💡 SOLUTION: Check Firestore rules and authentication');
  }
  
  console.log('\n🎉 Tests complete!');
};

// Export for browser console access
if (typeof window !== 'undefined') {
  (window as any).testPublicFilms = {
    runPublicFilmsTests,
    testDirectPublicAccess,
    testLegacyConversion
  };
}
