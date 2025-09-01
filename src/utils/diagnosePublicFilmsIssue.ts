import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

/**
 * Comprehensive diagnostic utility for public films access issue
 * This will help identify the root cause of "No Public Films Available"
 */

export interface DiagnosticResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Check if films collection exists and has data
 */
export const checkFilmsCollectionExists = async (): Promise<DiagnosticResult> => {
  try {
    console.log('🔍 Checking if films collection exists...');
    
    const filmsRef = collection(db, 'films');
    const snapshot = await getDocs(filmsRef);
    
    if (snapshot.empty) {
      return {
        success: false,
        message: 'Films collection is empty - no films exist in the database',
        data: { count: 0, films: [] }
      };
    }
    
    const films = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('✅ Films collection exists with', films.length, 'films');
    
    return {
      success: true,
      message: `Found ${films.length} films in collection`,
      data: {
        count: films.length,
        films: films.map((f: any) => ({
          id: f.id,
          title: f.titleEn || f.title || 'Untitled',
          publicationStatus: f.publicationStatus,
          status: f.status,
          createdAt: f.createdAt
        }))
      }
    };
  } catch (error) {
    console.error('❌ Error checking films collection:', error);
    return {
      success: false,
      message: 'Error accessing films collection',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Check specifically for films with publicationStatus: 'public'
 */
export const checkPublicFilms = async (): Promise<DiagnosticResult> => {
  try {
    console.log('🔍 Checking for films with publicationStatus: "public"...');
    
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
        message: 'No films found with publicationStatus: "public"',
        data: { count: 0, films: [] }
      };
    }
    
    const publicFilms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('✅ Found', publicFilms.length, 'public films');
    
    return {
      success: true,
      message: `Found ${publicFilms.length} films with publicationStatus: "public"`,
      data: {
        count: publicFilms.length,
        films: publicFilms.map((f: any) => ({
          id: f.id,
          title: f.titleEn || f.title || 'Untitled',
          publicationStatus: f.publicationStatus,
          status: f.status,
          director: f.director,
          createdAt: f.createdAt
        }))
      }
    };
  } catch (error) {
    console.error('❌ Error checking public films:', error);
    return {
      success: false,
      message: 'Error querying public films',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Analyze the publicationStatus field distribution
 */
export const analyzePublicationStatusDistribution = async (): Promise<DiagnosticResult> => {
  try {
    console.log('🔍 Analyzing publicationStatus field distribution...');
    
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
      missingPublicationStatus: 0,
      publicationStatusValues: {} as Record<string, number>,
      statusValues: {} as Record<string, number>,
      filmDetails: [] as any[]
    };
    
    snapshot.docs.forEach(doc => {
      const data = doc.data() as any;
      
      // Track publicationStatus
      if (data.publicationStatus) {
        analysis.hasPublicationStatus++;
        analysis.publicationStatusValues[data.publicationStatus] = 
          (analysis.publicationStatusValues[data.publicationStatus] || 0) + 1;
      } else {
        analysis.missingPublicationStatus++;
      }
      
      // Track status field
      if (data.status) {
        analysis.statusValues[data.status] = 
          (analysis.statusValues[data.status] || 0) + 1;
      }
      
      // Store film details for debugging
      analysis.filmDetails.push({
        id: doc.id,
        title: data.titleEn || data.title || 'Untitled',
        publicationStatus: data.publicationStatus || 'MISSING',
        status: data.status || 'MISSING',
        createdAt: data.createdAt
      });
    });
    
    console.log('✅ Analysis complete:', analysis);
    
    return {
      success: true,
      message: 'Publication status analysis completed',
      data: analysis
    };
  } catch (error) {
    console.error('❌ Error analyzing publication status:', error);
    return {
      success: false,
      message: 'Error analyzing publication status distribution',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Test Firestore rules for public access
 */
export const testFirestoreRulesPublicAccess = async (): Promise<DiagnosticResult> => {
  try {
    console.log('🔍 Testing Firestore rules for public access...');
    
    // Try to read films without authentication (simulating public user)
    const filmsRef = collection(db, 'films');
    const publicQuery = query(filmsRef, where('publicationStatus', '==', 'public'));
    
    const snapshot = await getDocs(publicQuery);
    
    return {
      success: true,
      message: `Firestore rules allow public access - found ${snapshot.size} accessible films`,
      data: {
        accessGranted: true,
        filmsAccessible: snapshot.size,
        rulesWorking: true
      }
    };
  } catch (error) {
    console.error('❌ Firestore rules test failed:', error);
    return {
      success: false,
      message: 'Firestore rules may be blocking public access',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        accessGranted: false,
        rulesWorking: false
      }
    };
  }
};

/**
 * Run comprehensive diagnostics
 */
export const runComprehensiveDiagnostics = async (): Promise<void> => {
  console.log('🚀 Starting comprehensive public films diagnostics...');
  console.log('=' .repeat(60));
  
  const checks = [
    { name: 'Films Collection Exists', fn: checkFilmsCollectionExists },
    { name: 'Public Films Query', fn: checkPublicFilms },
    { name: 'Publication Status Analysis', fn: analyzePublicationStatusDistribution },
    { name: 'Firestore Rules Test', fn: testFirestoreRulesPublicAccess }
  ];
  
  const results: Record<string, DiagnosticResult> = {};
  
  for (const check of checks) {
    console.log(`\n📋 Running ${check.name}...`);
    const result = await check.fn();
    results[check.name] = result;
    
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
      if (result.data) {
        console.log('📊 Data:', result.data);
      }
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 DIAGNOSTIC SUMMARY');
  console.log('=' .repeat(60));
  
  // Provide recommendations based on results
  const collectionResult = results['Films Collection Exists'];
  const publicResult = results['Public Films Query'];
  const analysisResult = results['Publication Status Analysis'];
  const rulesResult = results['Firestore Rules Test'];
  
  if (!collectionResult.success) {
    console.log('🚨 ISSUE: No films exist in the database');
    console.log('💡 SOLUTION: Create test films or import existing films');
  } else if (!publicResult.success) {
    console.log('🚨 ISSUE: No films have publicationStatus: "public"');
    console.log('💡 SOLUTION: Update existing films to set publicationStatus: "public"');
    
    if (analysisResult.success && analysisResult.data) {
      console.log('📊 Current film status distribution:');
      console.log('   - Total films:', analysisResult.data.totalFilms);
      console.log('   - Films with publicationStatus:', analysisResult.data.hasPublicationStatus);
      console.log('   - Films missing publicationStatus:', analysisResult.data.missingPublicationStatus);
      console.log('   - PublicationStatus values:', analysisResult.data.publicationStatusValues);
      console.log('   - Status values:', analysisResult.data.statusValues);
    }
  } else {
    console.log('✅ Films with publicationStatus: "public" exist');
    console.log('🔍 The issue may be in the frontend logic or component rendering');
  }
  
  if (!rulesResult.success) {
    console.log('🚨 ISSUE: Firestore rules may be blocking public access');
    console.log('💡 SOLUTION: Check and redeploy Firestore rules');
  } else {
    console.log('✅ Firestore rules allow public access');
  }
  
  console.log('\n🎉 Diagnostics complete!');
};

/**
 * Quick diagnostic function for browser console
 */
export const quickDiagnose = async (): Promise<void> => {
  console.log('🔍 Quick public films diagnosis...');
  
  const publicResult = await checkPublicFilms();
  const analysisResult = await analyzePublicationStatusDistribution();
  
  if (publicResult.success) {
    console.log(`✅ Found ${publicResult.data?.count || 0} public films`);
    console.log('📋 Public films:', publicResult.data?.films);
  } else {
    console.error('❌ No public films found');
    console.error('🔥 Issue:', publicResult.message);
    
    if (analysisResult.success) {
      console.log('📊 Film status breakdown:', {
        total: analysisResult.data?.totalFilms,
        withPublicationStatus: analysisResult.data?.hasPublicationStatus,
        publicationStatusValues: analysisResult.data?.publicationStatusValues
      });
    }
  }
};

// Export for browser console access
if (typeof window !== 'undefined') {
  (window as any).diagnosePublicFilms = {
    runComprehensiveDiagnostics,
    quickDiagnose,
    checkFilmsCollectionExists,
    checkPublicFilms,
    analyzePublicationStatusDistribution,
    testFirestoreRulesPublicAccess
  };
}
