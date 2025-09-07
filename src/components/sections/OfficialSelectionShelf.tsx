import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useFeatureFilms } from "../../hooks/useFeatureFilms";
import { FeatureFilm } from "../../types/featureFilm.types";
import { useTypography } from "../../utils/typography";

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

// ✅ COMPREHENSIVE data mapping with ALL field variations and deep debugging
function mapFeatureFilmToDisplayFilm(featureFilm: FeatureFilm | any): Film {
  console.log('🎬 DEEP DEBUG - Processing film:', featureFilm.id);
  
  // === COMPREHENSIVE targetAudience handling ===
  let targetAudiences: string[] = [];
  
  // Check ALL possible field name variations
  const possibleTargetFields = [
    featureFilm.targetAudience,
    featureFilm.targetAudiences,
    featureFilm.target_audience,
    featureFilm['target-audience'],
    featureFilm.Target_Audience,
    featureFilm.TargetAudience
  ];
  
  console.log('👥 Checking targetAudience variations:', {
    targetAudience: featureFilm.targetAudience,
    targetAudiences: featureFilm.targetAudiences,
    target_audience: featureFilm.target_audience,
    types: possibleTargetFields.map(f => typeof f)
  });
  
  for (const field of possibleTargetFields) {
    if (field !== undefined && field !== null) {
      if (Array.isArray(field)) {
        // Handle array - filter out empty/invalid values
        targetAudiences = field.filter(item => 
          item && 
          typeof item === 'string' && 
          item.trim() !== '' &&
          item.toLowerCase() !== 'undefined' &&
          item.toLowerCase() !== 'null'
        );
        console.log('👥 ✅ Found targetAudience array:', targetAudiences);
        break;
      } else if (typeof field === 'string' && field.trim() !== '') {
        // Handle single string
        const cleanValue = field.trim();
        if (cleanValue.toLowerCase() !== 'undefined' && cleanValue.toLowerCase() !== 'null') {
          targetAudiences = [cleanValue];
          console.log('👥 ✅ Found targetAudience string:', targetAudiences);
          break;
        }
      } else if (typeof field === 'object' && field.length !== undefined) {
        // Handle object that might be array-like
        try {
          const arrayLike = Object.values(field).filter(item => 
            item && typeof item === 'string' && item.trim() !== ''
          );
          if (arrayLike.length > 0) {
            targetAudiences = arrayLike as string[];
            console.log('👥 ✅ Found targetAudience object-array:', targetAudiences);
            break;
          }
        } catch (e) {
          console.log('👥 ⚠️ Could not process targetAudience object:', field);
        }
      }
    }
  }
  
  if (targetAudiences.length === 0) {
    console.log('👥 ❌ No valid targetAudience found in any field variation');
  }

  // === COMPREHENSIVE afterScreenActivities handling ===
  let afterScreenActivities: string[] = [];
  
  // Check ALL possible field name variations
  const possibleActivityFields = [
    featureFilm.afterScreenActivities,
    featureFilm.afterScreenActivity,
    featureFilm.after_screen_activities,
    featureFilm['after-screen-activities'],
    featureFilm.After_Screen_Activities,
    featureFilm.AfterScreenActivities,
    featureFilm.postScreenActivities,
    featureFilm.activities
  ];
  
  console.log('🎪 Checking afterScreenActivities variations:', {
    afterScreenActivities: featureFilm.afterScreenActivities,
    afterScreenActivity: featureFilm.afterScreenActivity,
    after_screen_activities: featureFilm.after_screen_activities,
    types: possibleActivityFields.map(f => typeof f)
  });
  
  for (const field of possibleActivityFields) {
    if (field !== undefined && field !== null) {
      if (Array.isArray(field)) {
        // Handle array
        afterScreenActivities = field.filter(item => 
          item && 
          typeof item === 'string' && 
          item.trim() !== '' &&
          item.toLowerCase() !== 'undefined' &&
          item.toLowerCase() !== 'null'
        );
        console.log('🎪 ✅ Found afterScreenActivities array:', afterScreenActivities);
        break;
      } else if (typeof field === 'string' && field.trim() !== '') {
        // Handle single string
        const cleanValue = field.trim();
        if (cleanValue.toLowerCase() !== 'undefined' && cleanValue.toLowerCase() !== 'null') {
          afterScreenActivities = [cleanValue];
          console.log('🎪 ✅ Found afterScreenActivities string:', afterScreenActivities);
          break;
        }
      } else if (typeof field === 'object' && field.length !== undefined) {
        // Handle object that might be array-like
        try {
          const arrayLike = Object.values(field).filter(item => 
            item && typeof item === 'string' && item.trim() !== ''
          );
          if (arrayLike.length > 0) {
            afterScreenActivities = arrayLike as string[];
            console.log('🎪 ✅ Found afterScreenActivities object-array:', afterScreenActivities);
            break;
          }
        } catch (e) {
          console.log('🎪 ⚠️ Could not process afterScreenActivities object:', field);
        }
      }
    }
  }
  
  if (afterScreenActivities.length === 0) {
    console.log('🎪 ❌ No valid afterScreenActivities found in any field variation');
  }

  // === COMPREHENSIVE category handling ===
  let category = 'Official Selection'; // Default
  
  const possibleCategoryFields = [
    featureFilm.category,
    featureFilm.Category,
    featureFilm.film_category,
    featureFilm.filmCategory,
    featureFilm['film-category']
  ];
  
  console.log('📂 Checking category variations:', possibleCategoryFields);
  
  for (const field of possibleCategoryFields) {
    if (field && typeof field === 'string' && field.trim() !== '') {
      const cleanValue = field.trim();
      if (cleanValue.toLowerCase() !== 'undefined' && cleanValue.toLowerCase() !== 'null') {
        category = cleanValue;
        console.log('📂 ✅ Found category:', category);
        break;
      }
    }
  }
  
  if (category === 'Official Selection') {
    console.log('📂 ⚠️ Using default category (no valid category found)');
  }

  // === Handle image data from multiple sources ===
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

  // Extract year from screeningDate1 if available
  let extractedYear: number | undefined;
  if (featureFilm.screeningDate1) {
    try {
      const date = new Date(featureFilm.screeningDate1);
      if (!isNaN(date.getTime())) {
        extractedYear = date.getFullYear();
      }
    } catch (e) {
      console.log('📅 Warning: Could not extract year from screeningDate1');
    }
  }

  const mappedFilm = {
    id: featureFilm.id,
    title: featureFilm.titleEn || featureFilm.title || 'Untitled',
    titleTh: featureFilm.titleTh,
    publicationStatus: featureFilm.publicationStatus,
    year: featureFilm.releaseYear || extractedYear,
    
    // Image data
    galleryUrls,
    galleryCoverIndex,
    galleryLogoIndex,
    posterUrl,
    
    // Content data
    genres: Array.isArray(featureFilm.genres) ? featureFilm.genres : (featureFilm.genres ? [featureFilm.genres] : []),
    runtimeMinutes: featureFilm.length || featureFilm.duration || 120,
    logline: featureFilm.logline || featureFilm.synopsis || '',
    
    // ✅ Use processed data (NOT fallbacks)
    targetAudiences: targetAudiences,
    afterScreenActivities: afterScreenActivities,
    category: category
  };

  console.log('✅ FINAL MAPPED RESULT:', {
    id: mappedFilm.id,
    title: mappedFilm.title,
    targetAudiences: mappedFilm.targetAudiences,
    afterScreenActivities: mappedFilm.afterScreenActivities,
    category: mappedFilm.category,
    dataFound: {
      hasTargetAudiences: mappedFilm.targetAudiences.length > 0,
      hasAfterScreenActivities: mappedFilm.afterScreenActivities.length > 0,
      hasCustomCategory: mappedFilm.category !== 'Official Selection'
    }
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

// Helper functions
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

function formatTargetAudienceWithEmoji(audience: string): string {
  const audienceMap: { [key: string]: string } = {
    // Common English values
    'general': '🌟 General Audience',
    'adults': '👨‍👩‍👧‍👦 Adults',
    'teens': '👦 Teens',
    'children': '🧒 Children',
    'family': '👨‍👩‍👧‍👦 Family',
    'students': '🎓 Students',
    'seniors': '👴 Seniors',
    
    // Possible database values
    'popcorn': '🍿 Popcorn',
    'cinephile': '🎭 Cinephile',
    'college student': '🎓 College Student',
    'art people': '🎨 Art People',
    'folk': '🎵 Folk',
    'novel fan': '📚 Novel Fan',
    'j-horror fan': '👻 J-Horror Fan',
    'youth': '🌟 Youth',
    
    // Exact case matches
    'Popcorn': '🍿 Popcorn',
    'Cinephile': '🎭 Cinephile',
    'College Student': '🎓 College Student',
    'Student': '📚 Student',
    'Art People': '🎨 Art People',
    'Folk': '🎵 Folk',
    'Novel Fan': '📚 Novel Fan',
    'J-Horror Fan': '👻 J-Horror Fan',
    'Youth': '🌟 Youth',
    'Family': '👨‍👩‍👧‍👦 Family'
  };
  
  const lowerAudience = audience.toLowerCase().trim();
  return audienceMap[audience] || audienceMap[lowerAudience] || `👥 ${audience}`;
}

function formatAfterScreenActivity(activity: string): string {
  const activityMap: { [key: string]: string } = {
    'qna': '🎤 Q&A Session',
    'talk': '💬 Director Talk',
    'redcarpet': '🔴 Red Carpet',
    'fanmeeting': '👥 Fan Meeting',
    'education': '📚 Education Event',
    
    // Variations
    'q&a': '🎤 Q&A Session',
    'director_talk': '💬 Director Talk',
    'red_carpet': '🔴 Red Carpet',
    'fan_meeting': '👥 Fan Meeting',
    'director talk': '💬 Director Talk',
    'red carpet': '🔴 Red Carpet',
    'fan meeting': '👥 Fan Meeting'
  };
  
  const lowerActivity = activity.toLowerCase().trim();
  return activityMap[activity] || activityMap[lowerActivity] || `🎬 ${activity}`;
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
  const { getClass } = useTypography();

  return (
    <div className="text-center mb-8">
      <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 ${getClass('header')}`}>
        Official Selection 2025
      </h2>
      <p className={`text-lg text-white/80 ${getClass('subtitle')}`}>
        ภาพยนตร์นานาชาติที่ได้รับการคัดเลือก
      </p>
    </div>
  );
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
  const { getClass } = useTypography();
  
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
          <span className={`text-[11px] sm:text-[12px] md:text-sm font-extrabold tracking-widest uppercase text-white drop-shadow [writing-mode:vertical-rl] [text-orientation:upright] text-center ${getClass('header')}`}>
            {getDisplayTitle()}
          </span>
        </div>
      ) : (
        // Expanded: 4-grid layout with 3:1 ratio
        <div className="absolute inset-0 flex flex-col p-4 sm:p-6 md:p-8">
          {/* Main content area */}
          <div className="flex-1 grid grid-cols-4 gap-4">
            {/* Left section - Main info (3 columns) */}
            <div className="col-span-3 flex flex-col space-y-4">
              {/* Logo */}
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

              {/* Title + Year */}
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight drop-shadow ${getClass('header')}`}>
                  {getDisplayTitle()}
                </h2>
                {film.year && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 ${getClass('body')}`}>
                    {film.year}
                  </span>
                )}
              </div>

              {/* Category + Runtime */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white border border-purple-500/30 shadow-lg ${getClass('body')}`}>
                  📂 {film.category || 'Not Specified'}
                </span>
                {film.runtimeMinutes && (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 ${getClass('body')}`}>
                    🕐 {formatRuntime(film.runtimeMinutes)}
                  </span>
                )}
              </div>

              {/* Genre header and badges in same row */}
              <div className="flex items-center gap-4 flex-wrap">
                <h3 className={`text-lg font-semibold text-white/90 shrink-0 ${getClass('subtitle')}`}>Genre:</h3>
                <div className="flex flex-wrap gap-2">
                  {formatGenresWithEmojis(film.genres).map((genre, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30 ${getClass('body')}`}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              {/* Target Audience header and badges in same row */}
              <div className="flex items-center gap-4 flex-wrap">
                <h4 className={`text-lg font-semibold text-white/90 shrink-0 ${getClass('subtitle')}`}>Target Audience:</h4>
                <div className="flex flex-wrap gap-2">
                  {film.targetAudiences && film.targetAudiences.length > 0 ? (
                    film.targetAudiences.map((audience, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30 ${getClass('body')}`}
                      >
                        {formatTargetAudienceWithEmoji(audience)}
                      </span>
                    ))
                  ) : (
                    <span className={`text-white/50 text-sm italic ${getClass('body')}`}>
                      Target audience not specified in database
                    </span>
                  )}
                </div>
              </div>

              {/* Logline */}
              {film.logline && (
                <div className="space-y-2">
                  <p className={`text-white/90 text-sm sm:text-base leading-relaxed line-clamp-4 ${getClass('body')}`}>
                    {film.logline}
                  </p>
                </div>
              )}
            </div>

            {/* Right section - Empty space to maintain grid (1 column) */}
            <div className="col-span-1">
              {/* This space is intentionally left empty to maintain the 3:1 ratio */}
            </div>
          </div>

          {/* Bottom row - Activities (left) and More Information button (right) */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            {/* Left section - After Screen Activities (3 columns) */}
            <div className="col-span-3 flex items-end">
              {film.afterScreenActivities && film.afterScreenActivities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {film.afterScreenActivities.map((activity, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 ${getClass('body')}`}
                    >
                      {formatAfterScreenActivity(activity)}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Right section - More Information button (1 column) */}
            <div className="col-span-1 flex items-end justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle detail button click - could navigate to detail page
                  console.log('Detail button clicked for:', film.title);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-amber-600/80 to-orange-600/80 text-white border border-amber-500/30 shadow-lg hover:from-amber-500/80 hover:to-orange-500/80 transition-all duration-200 ${getClass('body')}`}
              >
                More Information
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
