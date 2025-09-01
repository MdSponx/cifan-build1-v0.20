import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

/**
 * Comprehensive debugging utility for Official Selection Shelf
 * This utility helps diagnose issues with film display and filtering
 */

export interface DebugResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Check if films collection exists and has data
 */
export const checkFilmsCollection = async (): Promise<DebugResult> => {
  try {
    console.log('🔍 Checking films collection...');
    
    const filmsRef = collection(db, 'films');
    const snapshot = await getDocs(filmsRef);
    
    if (snapshot.empty) {
      return {
        success: false,
        message: 'Films collection is empty',
        data: { count: 0 }
      };
    }
    
    const films = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    console.log('✅ Films collection check complete:', {
      totalFilms: films.length,
      sampleFilm: films[0]
    });
    
    return {
      success: true,
      message: `Found ${films.length} films in collection`,
      data: {
        count: films.length,
        films: films.map((f: any) => ({
          id: f.id,
          title: f.titleEn || f.title,
          publicationStatus: f.publicationStatus,
          status: f.status
        }))
      }
    };
  } catch (error) {
    console.error('❌ Error checking films collection:', error);
    return {
      success: false,
      message: 'Error checking films collection',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Check for public films specifically
 */
export const checkPublicFilms = async (): Promise<DebugResult> => {
  try {
    console.log('🔍 Checking for public films...');
    
    const filmsRef = collection(db, 'films');
    const publicQuery = query(
      filmsRef,
      where('publicationStatus', '==', 'public'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(publicQuery);
    
    if (snapshot.empty) {
      return {
        success: false,
        message: 'No films with publicationStatus: "public" found',
        data: { count: 0 }
      };
    }
    
    const publicFilms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    console.log('✅ Public films check complete:', {
      publicFilmsCount: publicFilms.length
    });
    
    return {
      success: true,
      message: `Found ${publicFilms.length} public films`,
      data: {
        count: publicFilms.length,
        films: publicFilms.map((f: any) => ({
          id: f.id,
          title: f.titleEn || f.title,
          publicationStatus: f.publicationStatus,
          status: f.status,
          createdAt: f.createdAt
        }))
      }
    };
  } catch (error) {
    console.error('❌ Error checking public films:', error);
    return {
      success: false,
      message: 'Error checking public films',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Check Firestore security rules for films collection
 */
export const checkFirestoreRules = async (): Promise<DebugResult> => {
  try {
    console.log('🔍 Testing Firestore rules for public access...');
    
    // Try to read films without authentication
    const filmsRef = collection(db, 'films');
    const testQuery = query(filmsRef, where('publicationStatus', '==', 'public'));
    
    const snapshot = await getDocs(testQuery);
    
    return {
      success: true,
      message: 'Firestore rules allow public access to films with publicationStatus: "public"',
      data: {
        accessGranted: true,
        filmsFound: snapshot.size
      }
    };
  } catch (error) {
    console.error('❌ Firestore rules test failed:', error);
    return {
      success: false,
      message: 'Firestore rules may be blocking public access',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Analyze film data structure for inconsistencies
 */
export const analyzeFilmDataStructure = async (): Promise<DebugResult> => {
  try {
    console.log('🔍 Analyzing film data structure...');
    
    const filmsRef = collection(db, 'films');
    const snapshot = await getDocs(filmsRef);
    
    if (snapshot.empty) {
      return {
        success: false,
        message: 'No films to analyze'
      };
    }
    
    const analysis = {
      totalFilms: snapshot.size,
      hasPublicationStatus: 0,
      hasStatus: 0,
      hasTitleEn: 0,
      hasTitle: 0,
      publicationStatusValues: new Set<string>(),
      statusValues: new Set<string>(),
      missingFields: [] as string[]
    };
    
    snapshot.docs.forEach(doc => {
      const data = doc.data() as any;
      
      if (data.publicationStatus) {
        analysis.hasPublicationStatus++;
        analysis.publicationStatusValues.add(data.publicationStatus);
      }
      
      if (data.status) {
        analysis.hasStatus++;
        analysis.statusValues.add(data.status);
      }
      
      if (data.titleEn) analysis.hasTitleEn++;
      if (data.title) analysis.hasTitle++;
      
      // Check for missing critical fields
      if (!data.publicationStatus && !data.status) {
        analysis.missingFields.push(`Film ${doc.id}: Missing both publicationStatus and status`);
      }
      if (!data.titleEn && !data.title) {
        analysis.missingFields.push(`Film ${doc.id}: Missing both titleEn and title`);
      }
    });
    
    console.log('✅ Film data structure analysis complete:', analysis);
    
    return {
      success: true,
      message: 'Film data structure analyzed',
      data: {
        ...analysis,
        publicationStatusValues: Array.from(analysis.publicationStatusValues),
        statusValues: Array.from(analysis.statusValues)
      }
    };
  } catch (error) {
    console.error('❌ Error analyzing film data structure:', error);
    return {
      success: false,
      message: 'Error analyzing film data structure',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Test the complete data flow from database to component
 */
export const testCompleteDataFlow = async (): Promise<DebugResult> => {
  try {
    console.log('🔍 Testing complete data flow...');
    
    // Step 1: Check collection exists
    const collectionCheck = await checkFilmsCollection();
    if (!collectionCheck.success) {
      return collectionCheck;
    }
    
    // Step 2: Check for public films
    const publicCheck = await checkPublicFilms();
    if (!publicCheck.success) {
      return publicCheck;
    }
    
    // Step 3: Test Firestore rules
    const rulesCheck = await checkFirestoreRules();
    if (!rulesCheck.success) {
      return rulesCheck;
    }
    
    // Step 4: Analyze data structure
    const structureCheck = await analyzeFilmDataStructure();
    
    return {
      success: true,
      message: 'Complete data flow test passed',
      data: {
        collectionCheck: collectionCheck.data,
        publicCheck: publicCheck.data,
        rulesCheck: rulesCheck.data,
        structureCheck: structureCheck.data
      }
    };
  } catch (error) {
    console.error('❌ Complete data flow test failed:', error);
    return {
      success: false,
      message: 'Complete data flow test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Run all diagnostic checks
 */
export const runFullDiagnostics = async (): Promise<void> => {
  console.log('🚀 Starting Official Selection Shelf diagnostics...');
  
  const checks = [
    { name: 'Films Collection', fn: checkFilmsCollection },
    { name: 'Public Films', fn: checkPublicFilms },
    { name: 'Firestore Rules', fn: checkFirestoreRules },
    { name: 'Data Structure', fn: analyzeFilmDataStructure },
    { name: 'Complete Data Flow', fn: testCompleteDataFlow }
  ];
  
  for (const check of checks) {
    console.log(`\n📋 Running ${check.name} check...`);
    const result = await check.fn();
    
    if (result.success) {
      console.log(`✅ ${check.name}: ${result.message}`);
      if (result.data) {
        console.log('📊 Data:', result.data);
      }
    } else {
      console.error(`❌ ${check.name}: ${result.message}`);
      if (result.error) {
        console.error('🔥 Error:', result.error);
      }
    }
  }
  
  console.log('\n🎉 Diagnostics complete!');
};

/**
 * Quick check function for browser console
 */
export const quickCheck = async (): Promise<void> => {
  console.log('🔍 Quick Official Selection check...');
  
  const publicCheck = await checkPublicFilms();
  
  if (publicCheck.success) {
    console.log(`✅ Found ${publicCheck.data?.count || 0} public films`);
    console.log('📋 Public films:', publicCheck.data?.films);
  } else {
    console.error('❌ No public films found');
    console.error('🔥 Issue:', publicCheck.message);
  }
};

// Export for browser console access
if (typeof window !== 'undefined') {
  (window as any).debugOfficialSelection = {
    runFullDiagnostics,
    quickCheck,
    checkFilmsCollection,
    checkPublicFilms,
    checkFirestoreRules,
    analyzeFilmDataStructure,
    testCompleteDataFlow
  };
}
