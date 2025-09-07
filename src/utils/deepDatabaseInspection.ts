import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Deep database inspection utility to analyze actual field structure
 * and identify root causes of data display issues
 */
export async function deepDatabaseCheck() {
  try {
    console.log("📊 Starting deep database inspection...");
    const snapshot = await getDocs(collection(db, 'films'));
    
    if (snapshot.empty) {
      console.error("❌ NO FILMS IN DATABASE!");
      return { issue: "NO_FILMS", films: [] };
    }
    
    const films: any[] = [];
    const fieldAnalysis = {
      targetAudienceVariations: new Set<string>(),
      afterScreenActivitiesVariations: new Set<string>(),
      categoryVariations: new Set<string>(),
      fieldTypes: {
        targetAudience: new Set<string>(),
        afterScreenActivities: new Set<string>(),
        category: new Set<string>()
      },
      dataPatterns: {
        targetAudienceEmpty: 0,
        targetAudiencePopulated: 0,
        afterScreenActivitiesEmpty: 0,
        afterScreenActivitiesPopulated: 0,
        categoryEmpty: 0,
        categoryPopulated: 0
      }
    };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Check ALL possible field variations for targetAudience
      const targetAudienceFields = {
        targetAudience: data.targetAudience,
        targetAudiences: data.targetAudiences,
        target_audience: data.target_audience,
        'target-audience': data['target-audience'],
        Target_Audience: data.Target_Audience,
        TargetAudience: data.TargetAudience
      };
      
      // Check ALL possible field variations for afterScreenActivities
      const afterScreenActivitiesFields = {
        afterScreenActivities: data.afterScreenActivities,
        afterScreenActivity: data.afterScreenActivity,
        after_screen_activities: data.after_screen_activities,
        'after-screen-activities': data['after-screen-activities'],
        After_Screen_Activities: data.After_Screen_Activities,
        AfterScreenActivities: data.AfterScreenActivities,
        postScreenActivities: data.postScreenActivities,
        activities: data.activities
      };
      
      // Check ALL possible field variations for category
      const categoryFields = {
        category: data.category,
        Category: data.Category,
        film_category: data.film_category,
        filmCategory: data.filmCategory,
        'film-category': data['film-category']
      };
      
      // Analyze targetAudience
      let foundTargetAudience = false;
      Object.entries(targetAudienceFields).forEach(([fieldName, value]) => {
        if (value !== undefined && value !== null) {
          fieldAnalysis.targetAudienceVariations.add(fieldName);
          fieldAnalysis.fieldTypes.targetAudience.add(typeof value);
          foundTargetAudience = true;
        }
      });
      
      if (foundTargetAudience) {
        fieldAnalysis.dataPatterns.targetAudiencePopulated++;
      } else {
        fieldAnalysis.dataPatterns.targetAudienceEmpty++;
      }
      
      // Analyze afterScreenActivities
      let foundAfterScreenActivities = false;
      Object.entries(afterScreenActivitiesFields).forEach(([fieldName, value]) => {
        if (value !== undefined && value !== null) {
          fieldAnalysis.afterScreenActivitiesVariations.add(fieldName);
          fieldAnalysis.fieldTypes.afterScreenActivities.add(typeof value);
          foundAfterScreenActivities = true;
        }
      });
      
      if (foundAfterScreenActivities) {
        fieldAnalysis.dataPatterns.afterScreenActivitiesPopulated++;
      } else {
        fieldAnalysis.dataPatterns.afterScreenActivitiesEmpty++;
      }
      
      // Analyze category
      let foundCategory = false;
      Object.entries(categoryFields).forEach(([fieldName, value]) => {
        if (value !== undefined && value !== null) {
          fieldAnalysis.categoryVariations.add(fieldName);
          fieldAnalysis.fieldTypes.category.add(typeof value);
          foundCategory = true;
        }
      });
      
      if (foundCategory) {
        fieldAnalysis.dataPatterns.categoryPopulated++;
      } else {
        fieldAnalysis.dataPatterns.categoryEmpty++;
      }
      
      films.push({
        id: doc.id,
        title: data.titleEn || data.title,
        publicationStatus: data.publicationStatus,
        status: data.status,
        
        // Raw field data for inspection
        rawTargetAudienceFields: targetAudienceFields,
        rawAfterScreenActivitiesFields: afterScreenActivitiesFields,
        rawCategoryFields: categoryFields,
        
        // Type analysis
        fieldTypes: {
          targetAudience: typeof data.targetAudience,
          afterScreenActivities: typeof data.afterScreenActivities,
          category: typeof data.category
        },
        
        // Array checks
        isArrayCheck: {
          targetAudience: Array.isArray(data.targetAudience),
          afterScreenActivities: Array.isArray(data.afterScreenActivities)
        },
        
        // Value analysis
        valueAnalysis: {
          targetAudienceLength: Array.isArray(data.targetAudience) ? data.targetAudience.length : (data.targetAudience ? 1 : 0),
          afterScreenActivitiesLength: Array.isArray(data.afterScreenActivities) ? data.afterScreenActivities.length : (data.afterScreenActivities ? 1 : 0),
          categoryValue: data.category
        }
      });
    });
    
    console.log(`✅ Found ${films.length} films in database`);
    
    // Print comprehensive analysis
    console.log("\n🔍 COMPREHENSIVE FIELD ANALYSIS:");
    console.log("=====================================");
    
    console.log("\n📊 TARGET AUDIENCE ANALYSIS:");
    console.log(`  - Field variations found: ${Array.from(fieldAnalysis.targetAudienceVariations).join(', ')}`);
    console.log(`  - Data types found: ${Array.from(fieldAnalysis.fieldTypes.targetAudience).join(', ')}`);
    console.log(`  - Films with data: ${fieldAnalysis.dataPatterns.targetAudiencePopulated}`);
    console.log(`  - Films without data: ${fieldAnalysis.dataPatterns.targetAudienceEmpty}`);
    
    console.log("\n🎪 AFTER SCREEN ACTIVITIES ANALYSIS:");
    console.log(`  - Field variations found: ${Array.from(fieldAnalysis.afterScreenActivitiesVariations).join(', ')}`);
    console.log(`  - Data types found: ${Array.from(fieldAnalysis.fieldTypes.afterScreenActivities).join(', ')}`);
    console.log(`  - Films with data: ${fieldAnalysis.dataPatterns.afterScreenActivitiesPopulated}`);
    console.log(`  - Films without data: ${fieldAnalysis.dataPatterns.afterScreenActivitiesEmpty}`);
    
    console.log("\n📂 CATEGORY ANALYSIS:");
    console.log(`  - Field variations found: ${Array.from(fieldAnalysis.categoryVariations).join(', ')}`);
    console.log(`  - Data types found: ${Array.from(fieldAnalysis.fieldTypes.category).join(', ')}`);
    console.log(`  - Films with data: ${fieldAnalysis.dataPatterns.categoryPopulated}`);
    console.log(`  - Films without data: ${fieldAnalysis.dataPatterns.categoryEmpty}`);
    
    console.log("\n🎬 INDIVIDUAL FILM ANALYSIS:");
    console.log("=====================================");
    
    films.forEach((film, index) => {
      console.log(`\nFilm #${index + 1}: ${film.title}`);
      console.log(`  ID: ${film.id}`);
      console.log(`  Publication Status: ${film.publicationStatus}`);
      console.log(`  Status: ${film.status}`);
      
      // Target Audience Details
      console.log(`  Target Audience:`);
      Object.entries(film.rawTargetAudienceFields).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          console.log(`    - ${field}: ${JSON.stringify(value)} (${typeof value})`);
        }
      });
      
      // After Screen Activities Details
      console.log(`  After Screen Activities:`);
      Object.entries(film.rawAfterScreenActivitiesFields).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          console.log(`    - ${field}: ${JSON.stringify(value)} (${typeof value})`);
        }
      });
      
      // Category Details
      console.log(`  Category:`);
      Object.entries(film.rawCategoryFields).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          console.log(`    - ${field}: ${JSON.stringify(value)} (${typeof value})`);
        }
      });
    });
    
    // Generate recommendations
    console.log("\n💡 RECOMMENDATIONS:");
    console.log("=====================================");
    
    if (fieldAnalysis.targetAudienceVariations.size === 0) {
      console.log("❌ NO targetAudience fields found in any variation - this is the root cause!");
    } else {
      console.log(`✅ Found targetAudience in these field names: ${Array.from(fieldAnalysis.targetAudienceVariations).join(', ')}`);
    }
    
    if (fieldAnalysis.afterScreenActivitiesVariations.size === 0) {
      console.log("❌ NO afterScreenActivities fields found in any variation - this is the root cause!");
    } else {
      console.log(`✅ Found afterScreenActivities in these field names: ${Array.from(fieldAnalysis.afterScreenActivitiesVariations).join(', ')}`);
    }
    
    if (fieldAnalysis.categoryVariations.size === 0) {
      console.log("❌ NO category fields found in any variation - this is the root cause!");
    } else {
      console.log(`✅ Found category in these field names: ${Array.from(fieldAnalysis.categoryVariations).join(', ')}`);
    }
    
    return { 
      films, 
      fieldAnalysis,
      recommendations: {
        targetAudienceFields: Array.from(fieldAnalysis.targetAudienceVariations),
        afterScreenActivitiesFields: Array.from(fieldAnalysis.afterScreenActivitiesVariations),
        categoryFields: Array.from(fieldAnalysis.categoryVariations),
        dataTypes: {
          targetAudience: Array.from(fieldAnalysis.fieldTypes.targetAudience),
          afterScreenActivities: Array.from(fieldAnalysis.fieldTypes.afterScreenActivities),
          category: Array.from(fieldAnalysis.fieldTypes.category)
        }
      }
    };
    
  } catch (error) {
    console.error("❌ Database inspection failed:", error);
    return { issue: "DATABASE_ERROR", error };
  }
}

/**
 * Quick inspection function for browser console
 */
export async function quickInspect() {
  const result = await deepDatabaseCheck();
  
  if (result.issue) {
    console.log(`❌ Issue detected: ${result.issue}`);
    return result;
  }
  
  console.log("\n🚀 QUICK SUMMARY:");
  console.log("==================");
  console.log(`Total films: ${result.films?.length || 0}`);
  
  if (result.recommendations) {
    console.log(`Target audience fields: ${result.recommendations.targetAudienceFields.join(', ') || 'NONE FOUND'}`);
    console.log(`After screen activities fields: ${result.recommendations.afterScreenActivitiesFields.join(', ') || 'NONE FOUND'}`);
    console.log(`Category fields: ${result.recommendations.categoryFields.join(', ') || 'NONE FOUND'}`);
  }
  
  return result;
}

// Make functions available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).deepDatabaseCheck = deepDatabaseCheck;
  (window as any).quickInspect = quickInspect;
}
