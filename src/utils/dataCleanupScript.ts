import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * UNIFIED DATA STRUCTURE CLEANUP SCRIPT
 * 
 * This script ensures all film data in the database follows the unified index-based system.
 * It removes any boolean flag-based gallery data and converts it to index-based format.
 * 
 * Run this script once to clean up existing data after implementing the unified system.
 */

interface CleanupResult {
  totalFilms: number;
  cleanedFilms: number;
  errors: string[];
  details: Array<{
    id: string;
    title: string;
    action: string;
    before: any;
    after: any;
  }>;
}

/**
 * Clean up film data to use unified index-based system
 */
export async function cleanupFilmData(): Promise<CleanupResult> {
  const result: CleanupResult = {
    totalFilms: 0,
    cleanedFilms: 0,
    errors: [],
    details: []
  };

  try {
    console.log('🧹 Starting film data cleanup...');
    
    // Get all films from the collection
    const filmsCollection = collection(db, 'films');
    const snapshot = await getDocs(filmsCollection);
    
    result.totalFilms = snapshot.size;
    console.log(`📊 Found ${result.totalFilms} films to process`);

    for (const filmDoc of snapshot.docs) {
      try {
        const data = filmDoc.data();
        const filmId = filmDoc.id;
        const filmTitle = data.titleEn || data.title || 'Untitled';
        
        console.log(`🔍 Processing film: ${filmTitle} (${filmId})`);
        
        let needsUpdate = false;
        const updateData: any = {};
        const cleanupDetails = {
          id: filmId,
          title: filmTitle,
          action: 'no-change',
          before: {
            galleryUrls: data.galleryUrls,
            galleryCoverIndex: data.galleryCoverIndex,
            galleryLogoIndex: data.galleryLogoIndex
          },
          after: {}
        };

        // Check if galleryUrls contains objects (flag-based system)
        if (data.galleryUrls && Array.isArray(data.galleryUrls)) {
          const hasObjectUrls = data.galleryUrls.some((item: any) => 
            typeof item === 'object' && item !== null
          );

          if (hasObjectUrls) {
            console.log(`🔄 Converting flag-based gallery to index-based for: ${filmTitle}`);
            
            // Extract URLs and find indices
            const cleanUrls: string[] = [];
            let newCoverIndex: number | undefined;
            let newLogoIndex: number | undefined;

            data.galleryUrls.forEach((item: any, index: number) => {
              if (typeof item === 'object' && item !== null) {
                // Object format - extract URL and check flags
                if (item.url) {
                  cleanUrls.push(item.url);
                  
                  if (item.isCover === true) {
                    newCoverIndex = cleanUrls.length - 1;
                  }
                  if (item.isLogo === true) {
                    newLogoIndex = cleanUrls.length - 1;
                  }
                }
              } else if (typeof item === 'string') {
                // String format - keep as is
                cleanUrls.push(item);
              }
            });

            // Update the data
            updateData.galleryUrls = cleanUrls;
            
            // Set indices if found, otherwise preserve existing ones
            if (newCoverIndex !== undefined) {
              updateData.galleryCoverIndex = newCoverIndex;
            } else if (data.galleryCoverIndex !== undefined) {
              // Validate existing index
              if (data.galleryCoverIndex >= 0 && data.galleryCoverIndex < cleanUrls.length) {
                updateData.galleryCoverIndex = data.galleryCoverIndex;
              } else {
                updateData.galleryCoverIndex = cleanUrls.length > 0 ? 0 : undefined;
              }
            }
            
            if (newLogoIndex !== undefined) {
              updateData.galleryLogoIndex = newLogoIndex;
            } else if (data.galleryLogoIndex !== undefined) {
              // Validate existing index
              if (data.galleryLogoIndex >= 0 && data.galleryLogoIndex < cleanUrls.length) {
                updateData.galleryLogoIndex = data.galleryLogoIndex;
              } else {
                updateData.galleryLogoIndex = undefined;
              }
            }

            needsUpdate = true;
            cleanupDetails.action = 'converted-flags-to-indices';
            cleanupDetails.after = {
              galleryUrls: updateData.galleryUrls,
              galleryCoverIndex: updateData.galleryCoverIndex,
              galleryLogoIndex: updateData.galleryLogoIndex
            };

            console.log(`✅ Converted ${filmTitle}:`, {
              originalUrls: data.galleryUrls.length,
              cleanUrls: cleanUrls.length,
              coverIndex: updateData.galleryCoverIndex,
              logoIndex: updateData.galleryLogoIndex
            });
          }
        }

        // Validate existing indices even if no conversion needed
        if (!needsUpdate && data.galleryUrls && Array.isArray(data.galleryUrls)) {
          const galleryLength = data.galleryUrls.length;
          let indexFixed = false;

          // Check cover index
          if (data.galleryCoverIndex !== undefined) {
            if (data.galleryCoverIndex < 0 || data.galleryCoverIndex >= galleryLength) {
              updateData.galleryCoverIndex = galleryLength > 0 ? 0 : undefined;
              indexFixed = true;
              console.log(`🔧 Fixed out-of-bounds cover index for ${filmTitle}: ${data.galleryCoverIndex} -> ${updateData.galleryCoverIndex}`);
            }
          }

          // Check logo index
          if (data.galleryLogoIndex !== undefined) {
            if (data.galleryLogoIndex < 0 || data.galleryLogoIndex >= galleryLength) {
              updateData.galleryLogoIndex = undefined;
              indexFixed = true;
              console.log(`🔧 Fixed out-of-bounds logo index for ${filmTitle}: ${data.galleryLogoIndex} -> undefined`);
            }
          }

          if (indexFixed) {
            needsUpdate = true;
            cleanupDetails.action = 'fixed-invalid-indices';
            cleanupDetails.after = {
              galleryUrls: data.galleryUrls,
              galleryCoverIndex: updateData.galleryCoverIndex ?? data.galleryCoverIndex,
              galleryLogoIndex: updateData.galleryLogoIndex ?? data.galleryLogoIndex
            };
          }
        }

        // Update the document if needed
        if (needsUpdate) {
          await updateDoc(doc(db, 'films', filmId), updateData);
          result.cleanedFilms++;
          console.log(`💾 Updated film: ${filmTitle}`);
        } else {
          console.log(`✅ Film already clean: ${filmTitle}`);
        }

        result.details.push(cleanupDetails);

      } catch (error) {
        const errorMsg = `Error processing film ${filmDoc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    console.log('🎉 Cleanup completed!', {
      totalFilms: result.totalFilms,
      cleanedFilms: result.cleanedFilms,
      errors: result.errors.length
    });

    return result;

  } catch (error) {
    const errorMsg = `Critical error during cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`💥 ${errorMsg}`);
    result.errors.push(errorMsg);
    return result;
  }
}

/**
 * Validate all film data after cleanup
 */
export async function validateFilmData(): Promise<{
  totalFilms: number;
  validFilms: number;
  issues: Array<{
    id: string;
    title: string;
    issues: string[];
  }>;
}> {
  const result = {
    totalFilms: 0,
    validFilms: 0,
    issues: [] as Array<{
      id: string;
      title: string;
      issues: string[];
    }>
  };

  try {
    console.log('🔍 Validating film data...');
    
    const filmsCollection = collection(db, 'films');
    const snapshot = await getDocs(filmsCollection);
    
    result.totalFilms = snapshot.size;

    for (const filmDoc of snapshot.docs) {
      const data = filmDoc.data();
      const filmId = filmDoc.id;
      const filmTitle = data.titleEn || data.title || 'Untitled';
      const filmIssues: string[] = [];

      // Check gallery structure
      if (data.galleryUrls) {
        if (!Array.isArray(data.galleryUrls)) {
          filmIssues.push('galleryUrls is not an array');
        } else {
          // Check if any items are objects (should all be strings)
          const hasObjects = data.galleryUrls.some((item: any) => typeof item === 'object');
          if (hasObjects) {
            filmIssues.push('galleryUrls contains objects (should be strings only)');
          }

          // Validate indices
          const galleryLength = data.galleryUrls.length;
          
          if (data.galleryCoverIndex !== undefined) {
            if (typeof data.galleryCoverIndex !== 'number') {
              filmIssues.push('galleryCoverIndex is not a number');
            } else if (data.galleryCoverIndex < 0 || data.galleryCoverIndex >= galleryLength) {
              filmIssues.push(`galleryCoverIndex (${data.galleryCoverIndex}) is out of bounds (0-${galleryLength - 1})`);
            }
          }

          if (data.galleryLogoIndex !== undefined) {
            if (typeof data.galleryLogoIndex !== 'number') {
              filmIssues.push('galleryLogoIndex is not a number');
            } else if (data.galleryLogoIndex < 0 || data.galleryLogoIndex >= galleryLength) {
              filmIssues.push(`galleryLogoIndex (${data.galleryLogoIndex}) is out of bounds (0-${galleryLength - 1})`);
            }
          }

          // Check for same index used for both
          if (data.galleryCoverIndex !== undefined && 
              data.galleryLogoIndex !== undefined && 
              data.galleryCoverIndex === data.galleryLogoIndex) {
            filmIssues.push(`Same index (${data.galleryCoverIndex}) used for both cover and logo`);
          }
        }
      }

      if (filmIssues.length === 0) {
        result.validFilms++;
      } else {
        result.issues.push({
          id: filmId,
          title: filmTitle,
          issues: filmIssues
        });
      }
    }

    console.log('✅ Validation completed:', {
      totalFilms: result.totalFilms,
      validFilms: result.validFilms,
      issuesFound: result.issues.length
    });

    return result;

  } catch (error) {
    console.error('💥 Error during validation:', error);
    throw error;
  }
}

/**
 * Run the complete cleanup and validation process
 */
export async function runCompleteCleanup(): Promise<void> {
  try {
    console.log('🚀 Starting complete film data cleanup process...');
    
    // Step 1: Clean up the data
    console.log('\n📋 Step 1: Cleaning up film data...');
    const cleanupResult = await cleanupFilmData();
    
    console.log('\n📊 Cleanup Summary:');
    console.log(`  Total films processed: ${cleanupResult.totalFilms}`);
    console.log(`  Films cleaned: ${cleanupResult.cleanedFilms}`);
    console.log(`  Errors: ${cleanupResult.errors.length}`);
    
    if (cleanupResult.errors.length > 0) {
      console.log('\n❌ Cleanup Errors:');
      cleanupResult.errors.forEach(error => console.log(`  - ${error}`));
    }

    // Step 2: Validate the results
    console.log('\n📋 Step 2: Validating cleaned data...');
    const validationResult = await validateFilmData();
    
    console.log('\n📊 Validation Summary:');
    console.log(`  Total films: ${validationResult.totalFilms}`);
    console.log(`  Valid films: ${validationResult.validFilms}`);
    console.log(`  Films with issues: ${validationResult.issues.length}`);
    
    if (validationResult.issues.length > 0) {
      console.log('\n⚠️ Remaining Issues:');
      validationResult.issues.forEach(issue => {
        console.log(`  Film: ${issue.title} (${issue.id})`);
        issue.issues.forEach(problemDesc => console.log(`    - ${problemDesc}`));
      });
    }

    if (validationResult.issues.length === 0) {
      console.log('\n🎉 SUCCESS: All films are now using the unified index-based system!');
    } else {
      console.log('\n⚠️ PARTIAL SUCCESS: Some issues remain and may need manual attention.');
    }

  } catch (error) {
    console.error('💥 Critical error during complete cleanup:', error);
    throw error;
  }
}

// Export individual functions for flexibility
export { cleanupFilmData as cleanupFilms, validateFilmData as validateFilms };
