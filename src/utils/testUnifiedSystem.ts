import { FeatureFilmData } from '../types/featureFilm.types';
import { SimpleFilm } from '../types/simpleFilm.types';
import { 
  getCover, 
  getLogo, 
  getPoster, 
  setCoverIndex, 
  setLogoIndex,
  debugFilmImages,
  validateImageIndices,
  cleanupImageIndices
} from './unifiedImageHelpers';

/**
 * TEST UNIFIED DATA STRUCTURE SYSTEM
 * 
 * This script demonstrates the unified index-based system in action.
 * Run this to see how simple and clear the new system is!
 */

// Test data - represents a film with gallery images
const testFilm: SimpleFilm = {
  id: "test-film-123",
  title: "Test Film: The Unified System",
  titleTh: "ระบบรวมศูนย์",
  
  // UNIFIED INDEX-BASED GALLERY
  galleryUrls: [
    "https://example.com/image1.jpg",    // Index 0
    "https://example.com/image2.jpg",    // Index 1
    "https://example.com/image3.jpg",    // Index 2
    "https://example.com/logo.png",      // Index 3
    "https://example.com/poster.jpg"     // Index 4
  ],
  galleryCoverIndex: 0,   // Cover = galleryUrls[0]
  galleryLogoIndex: 3,    // Logo = galleryUrls[3]
  posterUrl: "https://example.com/main-poster.jpg",
  
  genres: ["Drama", "Comedy"],
  runtimeMinutes: 120,
  logline: "A demonstration of the unified data structure system.",
  category: "Official Selection"
};

/**
 * Test basic image retrieval
 */
export function testBasicImageRetrieval(): void {
  console.log('🧪 Testing Basic Image Retrieval');
  console.log('=====================================');
  
  // ONE LINE EACH - Crystal clear!
  const cover = getCover(testFilm);
  const logo = getLogo(testFilm);
  const poster = getPoster(testFilm);
  
  console.log('✅ Cover Image:', cover);
  console.log('✅ Logo Image:', logo);
  console.log('✅ Poster Image:', poster);
  
  // Verify results
  console.log('\n🔍 Verification:');
  console.log(`Cover matches galleryUrls[${testFilm.galleryCoverIndex}]:`, 
    cover === testFilm.galleryUrls[testFilm.galleryCoverIndex!]);
  console.log(`Logo matches galleryUrls[${testFilm.galleryLogoIndex}]:`, 
    logo === testFilm.galleryUrls[testFilm.galleryLogoIndex!]);
  console.log(`Poster matches posterUrl:`, poster === testFilm.posterUrl);
}

/**
 * Test setting new indices
 */
export function testSettingIndices(): void {
  console.log('\n🧪 Testing Setting New Indices');
  console.log('=====================================');
  
  console.log('Original indices:');
  console.log(`  Cover: ${testFilm.galleryCoverIndex} → ${testFilm.galleryUrls[testFilm.galleryCoverIndex!]}`);
  console.log(`  Logo: ${testFilm.galleryLogoIndex} → ${testFilm.galleryUrls[testFilm.galleryLogoIndex!]}`);
  
  // Change cover to index 2
  const updatedFilm1 = setCoverIndex(testFilm, 2);
  console.log('\n✅ After setting cover to index 2:');
  console.log(`  Cover: ${updatedFilm1.galleryCoverIndex} → ${getCover(updatedFilm1)}`);
  
  // Change logo to index 4
  const updatedFilm2 = setLogoIndex(updatedFilm1, 4);
  console.log('\n✅ After setting logo to index 4:');
  console.log(`  Logo: ${updatedFilm2.galleryLogoIndex} → ${getLogo(updatedFilm2)}`);
  
  // Show final state
  console.log('\n📊 Final state:');
  debugFilmImages(updatedFilm2);
}

/**
 * Test validation and cleanup
 */
export function testValidationAndCleanup(): void {
  console.log('\n🧪 Testing Validation and Cleanup');
  console.log('=====================================');
  
  // Create a film with invalid indices
  const invalidFilm: SimpleFilm = {
    ...testFilm,
    galleryCoverIndex: 10,  // Out of bounds!
    galleryLogoIndex: -1    // Invalid!
  };
  
  console.log('Film with invalid indices:');
  console.log(`  Cover index: ${invalidFilm.galleryCoverIndex} (gallery has ${invalidFilm.galleryUrls.length} images)`);
  console.log(`  Logo index: ${invalidFilm.galleryLogoIndex}`);
  
  // Validate
  const validation = validateImageIndices(invalidFilm);
  console.log('\n🔍 Validation result:');
  console.log(`  Valid: ${validation.isValid}`);
  console.log(`  Issues: ${validation.issues.join(', ')}`);
  
  // Cleanup
  const cleanedFilm = cleanupImageIndices(invalidFilm);
  console.log('\n🧹 After cleanup:');
  console.log(`  Cover index: ${cleanedFilm.galleryCoverIndex}`);
  console.log(`  Logo index: ${cleanedFilm.galleryLogoIndex}`);
  
  // Validate again
  const validationAfter = validateImageIndices(cleanedFilm);
  console.log(`  Now valid: ${validationAfter.isValid}`);
}

/**
 * Test with FeatureFilmData (form data)
 */
export function testWithFeatureFilmData(): void {
  console.log('\n🧪 Testing with FeatureFilmData');
  console.log('=====================================');
  
  const featureFilmData: FeatureFilmData = {
    titleEn: "Feature Film Test",
    titleTh: "ทดสอบภาพยนตร์",
    category: "Official Selection",
    genres: ["Horror", "Thriller"],
    countries: ["Thailand"],
    languages: ["Thai", "English"],
    logline: "A test of the unified system with FeatureFilmData",
    synopsis: "This demonstrates that the unified helpers work with both SimpleFilm and FeatureFilmData types.",
    targetAudience: ["Cinephile", "Horror Fan"],
    
    // Gallery data - same structure as SimpleFilm
    galleryUrls: [
      "https://example.com/feature1.jpg",
      "https://example.com/feature2.jpg", 
      "https://example.com/feature-logo.png"
    ],
    galleryCoverIndex: 0,
    galleryLogoIndex: 2,
    posterUrl: "https://example.com/feature-poster.jpg",
    
    // Form-specific fields
    screeningDate1: "2024-12-01T19:00",
    timeEstimate: "ค่ำ",
    theatre: "Major Chiang Mai",
    director: "Test Director",
    producer: "Test Producer",
    studio: "Test Studio",
    distributor: "Test Distributor",
    mainActors: "Actor 1, Actor 2",
    screenerUrl: "https://example.com/screener.mp4",
    materials: "Test materials",
    afterScreenActivities: ["qna", "talk"],
    status: "ตอบรับ / Accepted",
    publicationStatus: "public",
    remarks: "Test remarks",
    guestComing: true
  };
  
  console.log('FeatureFilmData test:');
  console.log(`  Title: ${featureFilmData.titleEn}`);
  console.log(`  Cover: ${getCover(featureFilmData)}`);
  console.log(`  Logo: ${getLogo(featureFilmData)}`);
  console.log(`  Poster: ${getPoster(featureFilmData)}`);
  
  // Debug output
  debugFilmImages(featureFilmData);
}

/**
 * Compare old vs new approach
 */
export function compareOldVsNew(): void {
  console.log('\n🧪 Comparing Old vs New Approach');
  console.log('=====================================');
  
