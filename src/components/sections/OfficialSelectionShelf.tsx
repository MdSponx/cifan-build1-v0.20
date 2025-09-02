// แก้ไข src/components/sections/OfficialSelectionShelf.tsx
// ใช้ logic ตรงๆ โดยไม่ต้องพึ่ง helper functions

import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useFeatureFilms } from "../../hooks/useFeatureFilms";
import { FeatureFilm } from "../../types/featureFilm.types";

// --- Types ---
export interface Film {
  id: string;
  title: string;
  titleTh?: string;
  publicationStatus?: string;
  year?: number;
  galleryUrls?: string[];
  galleryCoverIndex?: number;
  galleryLogoIndex?: number;
  posterUrl?: string;
  genres?: string[] | string;
  runtimeMinutes?: number;
  logline?: string;
  targetAudiences?: string[];
  afterScreenActivities?: string[];
  category?: string;
}

// ✅ Enhanced data mapping with proper field handling and debugging
function mapFeatureFilmToDisplayFilm(featureFilm: FeatureFilm | any): Film {
  console.log('🎬 Processing film data:', {
    id: featureFilm.id,
    title: featureFilm.title || featureFilm.titleEn,
    publicationStatus: featureFilm.publicationStatus,
    status: featureFilm.status,
    hasGalleryUrls: !!featureFilm.galleryUrls,
    hasStills: !!featureFilm.files?.stills,
    hasPosterUrl: !!featureFilm.posterUrl,
    hasPosterFile: !!featureFilm.files?.poster,
    // Debug the problematic fields
    targetAudience: featureFilm.targetAudience,
    afterScreenActivities: featureFilm.afterScreenActivities,
    screeningDate1: featureFilm.screeningDate1
  });

  // Handle image data from multiple sources
  let galleryUrls: string[] = [];
  let galleryCoverIndex: number | undefined;
  let galleryLogoIndex: number | undefined;
  let posterUrl: string | undefined;

  // Priority 1: Legacy galleryUrls field (for backward compatibility)
  if (featureFilm.galleryUrls && Array.isArray(featureFilm.galleryUrls) && featureFilm.galleryUrls.length > 0) {
    galleryUrls = featureFilm.galleryUrls.filter((url: string) => url && url.trim() !== '');
    galleryCoverIndex = featureFilm.galleryCoverIndex;
    galleryLogoIndex = featureFilm.galleryLogoIndex;
    console.log('📸 Using legacy galleryUrls:', galleryUrls.length, 'images');
  }
  // Priority 2: New files.stills structure
  else if (featureFilm.files?.stills && Array.isArray(featureFilm.files.stills) && featureFilm.files.stills.length > 0) {
    galleryUrls = featureFilm.files.stills.map((still: any) => still.url).filter((url: string) => url && url.trim() !== '');
    // Find cover and logo indices from metadata
    galleryCoverIndex = featureFilm.files.stills.findIndex((still: any) => still.isCover);
    galleryLogoIndex = featureFilm.files.stills.findIndex((still: any) => still.isLogo);
    // Use first image as cover if no cover is marked
    if (galleryCoverIndex === -1 && galleryUrls.length > 0) galleryCoverIndex = 0;
    if (galleryLogoIndex === -1) galleryLogoIndex = undefined;
    console.log('📸 Using new files.stills:', galleryUrls.length, 'images');
  }

  // Handle poster URL from multiple sources
  if (featureFilm.posterUrl) {
    posterUrl = featureFilm.posterUrl;
    console.log('🖼️ Using legacy posterUrl');
  } else if (featureFilm.files?.poster?.url) {
    posterUrl = featureFilm.files.poster.url;
    console.log('🖼️ Using new files.poster.url');
  }

  // ✅ FIX: Extract year from screeningDate1 if available
  let extractedYear = new Date().getFullYear(); // Default fallback
  if (featureFilm.screeningDate1) {
    try {
      const screeningDate = new Date(featureFilm.screeningDate1);
      if (!isNaN(screeningDate.getTime())) {
        extractedYear = screeningDate.getFullYear();
        console.log('📅 Extracted year from screeningDate1:', extractedYear);
      }
    } catch (error) {
      console.warn('⚠️ Failed to parse screeningDate1:', featureFilm.screeningDate1);
    }
  }

  // ✅ FIX: Properly handle targetAudience array with aggressive debugging
  let targetAudiences: string[] = ['Cinephile']; // Default fallback
  console.log('🔍 DEBUG targetAudience:', {
    raw: featureFilm.targetAudience,
    type: typeof featureFilm.targetAudience,
    isArray: Array.isArray(featureFilm.targetAudience),
    length: featureFilm.targetAudience?.length
  });
  
  if (featureFilm.targetAudience) {
    if (Array.isArray(featureFilm.targetAudience) && featureFilm.targetAudience.length > 0) {
      targetAudiences = featureFilm.targetAudience;
      console.log('👥 ✅ Using targetAudience array:', targetAudiences);
    } else if (typeof featureFilm.targetAudience === 'string') {
      targetAudiences = [featureFilm.targetAudience];
      console.log('👥 ✅ Converting single targetAudience to array:', targetAudiences);
    } else {
      console.log('👥 ⚠️ targetAudience exists but not in expected format, using fallback');
    }
  } else {
    console.log('👥 ⚠️ No targetAudience found, using fallback');
  }

  // ✅ FIX: Properly handle afterScreenActivities array with aggressive debugging
  let afterScreenActivities: string[] = ['qna']; // Default fallback
  console.log('🔍 DEBUG afterScreenActivities:', {
    raw: featureFilm.afterScreenActivities,
    type: typeof featureFilm.afterScreenActivities,
    isArray: Array.isArray(featureFilm.afterScreenActivities),
    length: featureFilm.afterScreenActivities?.length
  });
  
  if (featureFilm.afterScreenActivities) {
    if (Array.isArray(featureFilm.afterScreenActivities) && featureFilm.afterScreenActivities.length > 0) {
      afterScreenActivities = featureFilm.afterScreenActivities;
      console.log('🎪 ✅ Using afterScreenActivities array:', afterScreenActivities);
    } else if (typeof featureFilm.afterScreenActivities === 'string') {
      afterScreenActivities = [featureFilm.afterScreenActivities];
      console.log('🎪 ✅ Converting single afterScreenActivities to array:', afterScreenActivities);
    } else {
      console.log('🎪 ⚠️ afterScreenActivities exists but not in expected format, using fallback');
    }
  } else {
    console.log('🎪 ⚠️ No afterScreenActivities found, using fallback');
  }

  const mappedFilm = {
    id: featureFilm.id,
    title: featureFilm.titleEn || featureFilm.title || 'Untitled',
    titleTh: featureFilm.titleTh,
    publicationStatus: featureFilm.publicationStatus,
    year: featureFilm.releaseYear || extractedYear, // Use extracted year from screeningDate1
    // Image data
    galleryUrls,
    galleryCoverIndex,
    galleryLogoIndex,
    posterUrl,
    // Content data with correct field names from actual data structure
    genres: Array.isArray(featureFilm.genres) ? featureFilm.genres : (featureFilm.genres ? [featureFilm.genres] : ['Drama']),
    runtimeMinutes: featureFilm.length || featureFilm.duration || 120, // 'length' field in actual data
    logline: featureFilm.logline || featureFilm.synopsis || '',
    targetAudiences: targetAudiences, // ✅ FIXED: Use properly handled array
    afterScreenActivities: afterScreenActivities, // ✅ FIXED: Use properly handled array
    category: featureFilm.category || 'Official Selection' // 'category' field in actual data
  };

  console.log('✅ Mapped film result:', {
    title: mappedFilm.title,
    year: mappedFilm.year,
    targetAudiences: mappedFilm.targetAudiences,
    afterScreenActivities: mappedFilm.afterScreenActivities,
    hasImages: mappedFilm.galleryUrls.length > 0,
    imageCount: mappedFilm.galleryUrls.length,
    hasCover: mappedFilm.galleryCoverIndex !== undefined,
    hasLogo: mappedFilm.galleryLogoIndex !== undefined,
    hasPoster: !!mappedFilm.posterUrl
  });

  return mappedFilm;
}

// ✅ Manual cover logic - เขียนใหม่ให้ชัดเจน
function getCoverUrl(film: Film): string | null {
  console.log(`🖼️ Getting cover for "${film.title}":`, {
    galleryUrls: film.galleryUrls?.length || 0,
    galleryCoverIndex: film.galleryCoverIndex,
    posterUrl: !!film.posterUrl
  });

  // Priority 1: Gallery image at specified cover index
  if (film.galleryUrls && film.galleryUrls.length > 0) {
    // ใช้ galleryCoverIndex ถ้ามี ไม่งั้นใช้รูปแรก
    const coverIndex = film.galleryCoverIndex !== undefined ? film.galleryCoverIndex : 0;
    
    // ตรวจสอบว่า index ไม่เกิน array length
    if (coverIndex >= 0 && coverIndex < film.galleryUrls.length) {
      const coverUrl = film.galleryUrls[coverIndex];
      if (coverUrl && coverUrl.trim() !== '') {
        console.log(`  ✅ Found cover from gallery[${coverIndex}]:`, coverUrl);
        return coverUrl;
      } else {
        console.log(`  ⚠️ Gallery[${coverIndex}] is empty`);
      }
    } else {
      console.log(`  ⚠️ Cover index ${coverIndex} is out of bounds (array length: ${film.galleryUrls.length})`);
    }
  } else {
    console.log('  ⚠️ No gallery URLs available');
  }

  // Priority 2: Poster URL as fallback
  if (film.posterUrl && film.posterUrl.trim() !== '') {
    console.log('  ✅ Found cover from poster:', film.posterUrl);
    return film.posterUrl;
  } else {
    console.log('  ⚠️ No poster URL available');
  }

  console.log('  ❌ No cover found');
  return null;
}

// ✅ Manual logo logic - เขียนใหม่ให้ชัดเจน
function getLogoUrl(film: Film): string | null {
  console.log(`🏷️ Getting logo for "${film.title}":`, {
    galleryUrls: film.galleryUrls?.length || 0,
    galleryLogoIndex: film.galleryLogoIndex
  });

  // Logo จะมีแค่ถ้า galleryLogoIndex ถูกกำหนดไว้
  if (film.galleryLogoIndex === undefined) {
    console.log('  ⚠️ No logo index specified');
    return null;
  }

  if (!film.galleryUrls || film.galleryUrls.length === 0) {
    console.log('  ⚠️ No gallery URLs available');
    return null;
  }

  // ตรวจสอบว่า logo index ไม่เกิน array length
  if (film.galleryLogoIndex >= 0 && film.galleryLogoIndex < film.galleryUrls.length) {
    const logoUrl = film.galleryUrls[film.galleryLogoIndex];
    if (logoUrl && logoUrl.trim() !== '') {
      console.log(`  ✅ Found logo from gallery[${film.galleryLogoIndex}]:`, logoUrl);
      return logoUrl;
    } else {
      console.log(`  ⚠️ Gallery[${film.galleryLogoIndex}] is empty`);
    }
  } else {
    console.log(`  ⚠️ Logo index ${film.galleryLogoIndex} is out of bounds (array length: ${film.galleryUrls.length})`);
  }

  console.log('  ❌ No logo found');
  return null;
}

// --- Main Component ---
export default function OfficialSelectionShelf({ className = "" }: { className?: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Use correct filter for published films
  const { films: featureFilms, loading, error } = useFeatureFilms(
    { status: 'published', publicationStatus: 'public' },
    true
  );

  const films = useMemo(() => {
    console.log('📊 Processing feature films data:', {
      featureFilms: !!featureFilms,
      count: featureFilms?.length || 0,
      loading,
      error: !!error
    });

    if (error) {
      console.error('❌ Error in useFeatureFilms:', error);
      return null;
    }
    
    if (!featureFilms) {
      console.log('ℹ️ No feature films data available yet');
      return null;
    }
    
    // 🚨 DEBUG: ดูข้อมูลดิบที่ hook ส่งมา
    console.log('🔥 RAW FEATURE FILMS FROM HOOK:');
    featureFilms.forEach((film, index) => {
      console.log(`   Film #${index + 1}:`, {
        id: film.id,
        title: (film as any).titleEn || film.title,
        galleryUrls: film.galleryUrls?.length || 0,
        galleryCoverIndex: film.galleryCoverIndex,
        galleryLogoIndex: film.galleryLogoIndex,
        posterUrl: !!film.posterUrl,
        publicationStatus: film.publicationStatus
      });
    });
    
    console.log(`🔄 Converting ${featureFilms.length} films to display format`);
    const convertedFilms = featureFilms.map(mapFeatureFilmToDisplayFilm);
    
    console.log(`✅ Final converted films: ${convertedFilms.length}`);
    
    // 🚨 DEBUG: ตรวจสอบผลลัพธ์หลังแปลง
    console.log('🔥 FINAL CONVERTED FILMS:');
    convertedFilms.forEach((film, index) => {
      console.log(`   Converted #${index + 1}:`, {
        id: film.id,
        title: film.title,
        galleryUrls: film.galleryUrls?.length || 0,
        galleryCoverIndex: film.galleryCoverIndex,
        galleryLogoIndex: film.galleryLogoIndex,
        posterUrl: !!film.posterUrl
      });
    });
    
    return convertedFilms;
  }, [featureFilms, error, loading]);

  useEffect(() => {
    if (!activeId) return;
    const el = document.getElementById(`spine-${activeId}`);
    el?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }, [activeId]);

  const handleCardClick = useCallback((filmId: string) => {
    setActiveId((prev) => (prev === filmId ? null : filmId));
  }, []);

  return (
    <section className={`relative w-full py-12 sm:py-16 md:py-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <ShelfHeader />

        <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-zinc-900/20 p-6">
          <div className="pointer-events-none absolute inset-x-6 bottom-3 h-2 rounded-full bg-black/50" />

          <div
            ref={scrollerRef}
            className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth py-4 snap-x snap-mandatory"
          >
            {loading && films === null && <LoadingSkeleton />}
            {error && <ErrorState error={error} />}
            {!loading && !error && films && films.length === 0 && <EmptyState />}
            {!loading && !error && films && films.length > 0 && (
              films.map((film) => (
                <div
                  key={film.id}
                  id={`spine-${film.id}`}
                  className="snap-start"
                  onClick={() => handleCardClick(film.id)}
                >
                  <SpineCard 
                    film={film} 
                    isActive={activeId === film.id} 
                    onToggle={() => handleCardClick(film.id)} 
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// --- SpineCard Component ---
interface SpineCardProps {
  film: Film;
  isActive: boolean;
  onToggle: () => void;
}

function SpineCard({ film, isActive, onToggle }: SpineCardProps): JSX.Element {
  const { i18n } = useTranslation();
  
  // ใช้ manual functions ที่เขียนใหม่
  const cover = getCoverUrl(film);
  const logo = getLogoUrl(film);
  
  // Debug output ให้เห็นชัดๆ
  console.log(`🎨 SpineCard for "${film.title}":`, { 
    cover: cover ? '✅ ' + cover.substring(0, 50) + '...' : '❌ No cover', 
    logo: logo ? '✅ ' + logo.substring(0, 50) + '...' : '❌ No logo'
  });

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  }, [onToggle]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  }, [onToggle]);

  // Get title based on language
  const getDisplayTitle = () => {
    if (i18n.language === 'th' && film.titleTh) {
      return film.titleTh;
    }
    return film.title;
  };

  return (
    <motion.article
      layout
      layoutId={`film-${film.id}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      aria-expanded={isActive}
      tabIndex={0}
      className={`group relative shrink-0 cursor-pointer select-none rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:scale-[.99] w-27 sm:w-32 md:w-38 lg:w-43`}
      style={{ 
        height: "32.4rem", 
        width: isActive ? "min(86vw, 75.6rem)" : undefined 
      }}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-zinc-900"
        style={{
          backgroundImage: cover ? `url(${cover})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Gradient overlay */}
      <div className={`absolute inset-0 transition-opacity ${
        isActive 
          ? "bg-gradient-to-r from-black/80 via-black/40 to-transparent opacity-100" 
          : "bg-gradient-to-b from-black/60 via-black/10 to-black/80 opacity-100"
      }`} />

      {/* Content */}
      {!isActive ? (
        // Collapsed: แสดงชื่อแนวตั้ง
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] sm:text-[12px] md:text-sm font-extrabold tracking-widest uppercase text-white drop-shadow [writing-mode:vertical-rl] [text-orientation:upright] text-center">
            {getDisplayTitle()}
          </span>
        </div>
      ) : (
        // Expanded: แสดงข้อมูลตามลำดับที่กำหนด
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 md:p-8">
            <div className="space-y-4">
              {/* 1. Logo */}
              {logo && (
                <div className="flex justify-start">
                  <img
                    src={logo}
                    alt={`${film.title} logo`}
                    className="h-12 sm:h-16 md:h-20 w-auto object-contain drop-shadow-lg"
                    onError={(e) => {
                      console.warn(`❌ Logo failed to load for ${film.title}:`, logo);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* 2. Title (EN or TH following web language version) + Year (badge) */}
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight drop-shadow">
                  {getDisplayTitle()}
                </h2>
                {film.year && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {film.year}
                  </span>
                )}
              </div>

              {/* 3. Category (Banner) + Runtime (badge with clock emoji) */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white border border-purple-500/30 shadow-lg">
                  {film.category}
                </span>
                {film.runtimeMinutes && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    🕐 {formatRuntime(film.runtimeMinutes)}
                  </span>
                )}
              </div>

              {/* 4. Genre: (Index head text and badges with different emoji) */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white/90">Genre:</h3>
                <div className="flex flex-wrap gap-2">
                  {formatGenresWithEmojis(film.genres).map((genre, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              {/* 5. Target Audience: (Index head text and badges with different emoji) */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white/90">Target Audience:</h3>
                <div className="flex flex-wrap gap-2">
                  {formatTargetAudiencesWithEmojis(film.targetAudiences).map((audience, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30"
                    >
                      {audience}
                    </span>
                  ))}
                </div>
              </div>

              {/* 6. Logline (Text) */}
              {film.logline && (
                <div className="space-y-2">
                  <p className="text-white/90 text-sm sm:text-base leading-relaxed line-clamp-4">
                    {film.logline}
                  </p>
                </div>
              )}
            </div>

            {/* 7. AfterScreenActivities: small banner (bottom left) + Detail button (bottom right) */}
            <div className="flex items-end justify-between mt-6">
              <div className="flex flex-wrap gap-2">
                {film.afterScreenActivities?.map((activity, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  >
                    {formatAfterScreenActivity(activity)}
                  </span>
                ))}
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle detail button click - could navigate to detail page
                  console.log('Detail button clicked for:', film.title);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-amber-600/80 to-orange-600/80 text-white border border-amber-500/30 shadow-lg hover:from-amber-500/80 hover:to-orange-500/80 transition-all duration-200"
              >
                Detail
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.article>
  );
}

// Helper functions
function formatGenres(genres?: string[] | string): string {
  if (!genres) return "-";
  return Array.isArray(genres) ? genres.join(", ") : genres;
}

function formatGenresWithEmojis(genres?: string[] | string): string[] {
  if (!genres) return [];
  
  const genreEmojis: { [key: string]: string } = {
    'Horror': '👻 Horror',
    'horror': '👻 Horror',
    'Comedy': '😂 Comedy',
    'comedy': '😂 Comedy',
    'Action': '💥 Action',
    'action': '💥 Action',
    'Sci Fi': '🚀 Sci Fi',
    'sci fi': '🚀 Sci Fi',
    'Crime/Thriller': '🔍 Crime/Thriller',
    'crime/thriller': '🔍 Crime/Thriller',
    'thriller': '🔍 Thriller',
    'Adventure': '🗺️ Adventure',
    'adventure': '🗺️ Adventure',
    'Animation': '🎨 Animation',
    'animation': '🎨 Animation',
    'Drama': '🎭 Drama',
    'drama': '🎭 Drama',
    'Documentary': '📽️ Documentary',
    'documentary': '📽️ Documentary',
    'Fantasy': '🧙‍♂️ Fantasy',
    'fantasy': '🧙‍♂️ Fantasy',
    'folklore': '🌙 Folklore',
    'Folklore': '🌙 Folklore',
    'magic': '✨ Magic',
    'Magic': '✨ Magic'
  };

  const genreArray = Array.isArray(genres) ? genres : [genres];
  return genreArray.map(genre => {
    const lowerGenre = genre.toLowerCase();
    return genreEmojis[genre] || genreEmojis[lowerGenre] || `🎬 ${genre}`;
  });
}

function formatTargetAudiencesWithEmojis(audiences?: string[]): string[] {
  if (!audiences) return [];
  
  const audienceEmojis: { [key: string]: string } = {
    'Popcorn': '🍿 Popcorn',
    'Cinephile': '🎬 Cinephile',
    'College Student': '🎓 College Student',
    'Student': '📚 Student',
    'Art People': '🎨 Art People',
    'Folk': '🌾 Folk',
    'Novel Fan': '📖 Novel Fan',
    'J-Horror Fan': '👹 J-Horror Fan',
    'Youth': '🧒 Youth',
    'Family': '👨‍👩‍👧‍👦 Family'
  };

  return audiences.map(audience => audienceEmojis[audience] || `👥 ${audience}`);
}

function formatAfterScreenActivity(activity: string): string {
  const activityLabels: { [key: string]: string } = {
    'qna': '❓ Q&A',
    'talk': '💬 Talk',
    'redcarpet': '🎭 Red Carpet',
    'fanmeeting': '🤝 Fan Meeting',
    'education': '📚 Education'
  };

  return activityLabels[activity] || `🎪 ${activity}`;
}

function formatRuntime(minutes?: number): string {
  if (!minutes) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} ชม. ${m} นาที` : `${m} นาที`;
}

// Loading, Error, Empty states
function LoadingSkeleton() {
  return (
    <div className="flex gap-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="w-27 sm:w-32 md:w-38 lg:w-43 bg-zinc-800 animate-pulse rounded-xl"
          style={{ height: "32.4rem" }}
        />
      ))}
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-red-400 mb-4">⚠️ เกิดข้อผิดพลาด: {error}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
      >
        ลองใหม่
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-white/60">
      <p>ยังไม่มีภาพยนตร์ในส่วนนี้</p>
    </div>
  );
}

function ShelfHeader() {
  return (
    <div className="text-center mb-8">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
        Official Selection 2025
      </h2>
      <p className="text-lg text-white/80">
        ภาพยนตร์นานาชาติที่ได้รับการคัดเลือก
      </p>
    </div>
  );
}
