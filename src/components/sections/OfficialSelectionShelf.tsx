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
  galleryUrls?: Array<string | { url: string; isCover?: boolean; isLogo?: boolean; tag?: string }>;
  coverUrl?: string;
  logoUrl?: string;
  genres?: string[] | string;
  runtimeMinutes?: number;
  logline?: string;
  targetAudiences?: string[];
  afterScreenActivities?: string[];
  category?: string;
}

// --- Data Conversion ---
function convertFeatureFilmToFilm(featureFilm: FeatureFilm | any): Film {
  // Handle both new FeatureFilm format and legacy FeatureFilmData format
  const isLegacyFormat = !featureFilm.files && (featureFilm.titleEn || featureFilm.posterUrl || featureFilm.galleryUrls);
  
  if (isLegacyFormat) {
    // Legacy format conversion with proper cover and logo handling
    const galleryUrls = featureFilm.galleryUrls || [];
    const coverIndex = featureFilm.galleryCoverIndex;
    const logoIndex = featureFilm.galleryLogoIndex;
    
    // Convert gallery URLs to proper format with cover and logo information
    const processedGalleryUrls = galleryUrls.map((url: string | any, index: number) => {
      if (typeof url === 'string') {
        return {
          url: url,
          isCover: coverIndex !== undefined ? index === coverIndex : index === 0,
          isLogo: logoIndex !== undefined ? index === logoIndex : false
        };
      } else if (url && typeof url === 'object' && url.url) {
        // Already in object format, preserve existing properties or set based on index
        return {
          url: url.url,
          isCover: url.isCover !== undefined ? url.isCover : (coverIndex !== undefined ? index === coverIndex : index === 0),
          isLogo: url.isLogo !== undefined ? url.isLogo : (logoIndex !== undefined ? index === logoIndex : false)
        };
      }
      return url;
    }).filter(Boolean); // Remove any invalid entries
    
    return {
      id: featureFilm.id,
      title: featureFilm.titleEn || featureFilm.title || 'Untitled',
      titleTh: featureFilm.titleTh,
      publicationStatus: featureFilm.publicationStatus || 'public',
      year: featureFilm.releaseYear || new Date().getFullYear(),
      galleryUrls: processedGalleryUrls,
      coverUrl: featureFilm.posterUrl,
      logoUrl: getLogoUrl({ galleryUrls: processedGalleryUrls }) || undefined,
      genres: featureFilm.genres || [],
      runtimeMinutes: featureFilm.length || featureFilm.duration,
      logline: featureFilm.logline || featureFilm.synopsis || '',
      targetAudiences: featureFilm.targetAudience || [],
      afterScreenActivities: featureFilm.afterScreenActivities || [],
      category: featureFilm.category || 'Official Selection'
    };
  }
  
  // New format conversion with proper cover and logo handling
  const stills = featureFilm.files?.stills || [];
  const processedGalleryUrls = stills.map((still: any, index: number) => ({
    url: still.url,
    isCover: index === 0, // For new format, assume first image is cover unless specified otherwise
    isLogo: still.isLogo || false // Check if this still is marked as logo
  }));
  
  return {
    id: featureFilm.id,
    title: featureFilm.title,
    titleTh: featureFilm.titleTh,
    publicationStatus: featureFilm.publicationStatus || (featureFilm.status === 'published' ? 'public' : 'draft'),
    year: featureFilm.releaseYear,
    galleryUrls: processedGalleryUrls,
    coverUrl: featureFilm.files?.poster?.url,
    logoUrl: getLogoUrl({ galleryUrls: processedGalleryUrls }) || undefined,
    genres: featureFilm.genres,
    runtimeMinutes: featureFilm.duration,
    logline: featureFilm.logline,
    targetAudiences: featureFilm.targetAudiences || [],
    afterScreenActivities: featureFilm.afterScreenActivities || []
  };
}

// --- Helpers ---
function getCoverUrl(film: Film): string | null {
  const g = film.galleryUrls ?? [];
  
  // Priority 1: Look for gallery image marked as cover
  for (const item of g) {
    if (typeof item !== "string" && item?.isCover && item.url) {
      return item.url;
    }
  }
  
  // Priority 2: Use first gallery image if available
  const first = g[0];
  if (first) {
    return typeof first === "string" ? first : first.url ?? null;
  }
  
  // Priority 3: Fall back to poster only if no gallery images exist
  if (film.coverUrl) return film.coverUrl;
  
  return null;
}

function getLogoUrl(film: { galleryUrls?: Array<string | { url: string; isCover?: boolean; isLogo?: boolean; tag?: string }> }): string | null {
  const g = film.galleryUrls ?? [];
  
  // Look for gallery image marked as logo
  for (const item of g) {
    if (typeof item !== "string" && item?.isLogo && item.url) {
      return item.url;
    }
  }
  
  return null;
}

function formatGenres(gen?: string[] | string): string {
  if (!gen) return "-";
  return Array.isArray(gen) ? gen.join(", ") : gen;
}

function formatRuntime(min?: number): string {
  if (!min) return "-";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h} ชม. ${m} นาที` : `${m} นาที`;
}

// Emoji mapping functions
function getGenreEmoji(genre: string): string {
  const genreEmojiMap: { [key: string]: string } = {
    'Horror': '👻',
    'Comedy': '😂',
    'Action': '💥',
    'Sci Fi': '🚀',
    'Crime/Thriller': '🔍',
    'Adventure': '🗺️',
    'Animation': '🎨',
    'Drama': '🎭',
    'Documentary': '📹',
    'Fantasy': '🧙‍♂️',
    'Mystery': '🔮',
    'Slasher': '🔪',
    'Thriller': '😱'
  };
  return genreEmojiMap[genre] || '🎬';
}

function getTargetAudienceEmoji(audience: string): string {
  const audienceEmojiMap: { [key: string]: string } = {
    'Popcorn': '🍿',
    'Cinephile': '🎭',
    'College Student': '🎓',
    'Student': '📚',
    'Art People': '🎨',
    'Folk': '🌾',
    'Novel Fan': '📖',
    'J-Horror Fan': '👹',
    'Youth': '🧑‍🎤',
    'Family': '👨‍👩‍👧‍👦'
  };
  return audienceEmojiMap[audience] || '👥';
}

function getActivityEmoji(activity: string): string {
  const activityEmojiMap: { [key: string]: string } = {
    'qna': '❓',
    'talk': '💬',
    'redcarpet': '🎪',
    'fanmeeting': '🤝',
    'education': '📚'
  };
  return activityEmojiMap[activity] || '🎪';
}

// --- UI Subcomponents ---
function ShelfHeader(): JSX.Element {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as 'en' | 'th';

  return (
    <div className="mb-8">
      {/* Grid Layout: 20% logo, 80% text */}
      <div className="grid grid-cols-5 gap-6 items-center">
        {/* Logo Section (20%) */}
        <div className="col-span-1 flex justify-center items-center">
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FT4%404x.png?alt=media&token=4b606f45-6165-4486-951b-4e4ccb0bdb23"
            alt="Official Selection"
            className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto object-contain brightness-0 invert opacity-90 mx-auto"
          />
        </div>
        
        {/* Text Section (80%) */}
        <div className="col-span-4 space-y-2">
          <h2 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white ${currentLanguage === 'th' ? 'header-th' : 'header-en'}`}>
            {t('featureFilm.categories.officialSelection')}
          </h2>
          <p className={`text-base sm:text-lg md:text-xl text-white/80 ${currentLanguage === 'th' ? 'body-th' : 'body-en'}`}>
            {currentLanguage === 'th' 
              ? 'ภาพยนตร์นานาชาติที่ได้รับการคัดเลือกในปี 2025'
              : 'International films selected in 2025'
            }
          </p>
        </div>
      </div>
    </div>
  );
}


interface SpineCardProps {
  film: Film;
  isActive: boolean;
  onToggle: () => void;
}

function SpineCard({ film, isActive, onToggle }: SpineCardProps): JSX.Element {
  const cover = getCoverUrl(film);
  
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

      {/* Gradient for readability */}
      <div className={`absolute inset-0 transition-opacity ${
        isActive 
          ? "bg-gradient-to-r from-black/70 via-black/30 to-transparent opacity-100" 
          : "bg-gradient-to-b from-black/60 via-black/10 to-black/80 opacity-100"
      }`} />

      {/* Content: collapsed = vertical title; expanded = overlay info */}
      {!isActive ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[11px] sm:text-[12px] md:text-sm font-extrabold tracking-widest uppercase text-white drop-shadow [writing-mode:vertical-rl] [text-orientation:upright] text-center"
            title={film.title}
          >
            {film.title}
          </span>
        </div>
      ) : (
        <div className="absolute inset-0 flex">
          {/* Info container - bottom-left */}
          <div className="flex-1 flex flex-col justify-end p-4 sm:p-6 md:p-8">
            <div className="max-w-[48ch]">
              {/* Film logo as large header */}
              {film.logoUrl && (
                <div className="mb-4">
                  <img
                    src={film.logoUrl}
                    alt={`${film.title} logo`}
                    className="h-12 sm:h-16 md:h-20 w-auto object-contain drop-shadow-lg"
                    style={{
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))'
                    }}
                  />
                </div>
              )}
              
              {/* Thai and English titles as subtitle */}
              <div className="mb-4">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight drop-shadow mb-1">
                  {film.title}
                </h3>
                {film.titleTh && (
                  <p className="text-sm sm:text-base text-white/80 drop-shadow">
                    {film.titleTh}
                  </p>
                )}
              </div>

              {/* Category banner and Runtime badge */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {/* Category banner */}
                {film.category && (
                  <span className="rounded-lg bg-gradient-to-r from-red-500/30 to-pink-500/30 px-4 py-2 ring-1 ring-red-400/40 backdrop-blur-sm text-xs sm:text-sm text-red-100 font-bold uppercase tracking-wide">
                    🏆 {film.category}
                  </span>
                )}
                
                {/* Runtime badge */}
                <span className="rounded-full bg-blue-500/20 px-3 py-1.5 ring-1 ring-blue-400/30 backdrop-blur-sm text-[11px] sm:text-xs text-blue-200 font-medium">
                  ⏱️ {formatRuntime(film.runtimeMinutes)}
                </span>
              </div>

              {/* Genres row with heading on same line */}
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide shrink-0">
                    Genre:
                  </h4>
                  {Array.isArray(film.genres) ? film.genres.map((genre, index) => (
                    <span key={index} className="rounded-full bg-purple-500/20 px-3 py-1.5 ring-1 ring-purple-400/30 backdrop-blur-sm text-[11px] sm:text-xs text-purple-200 font-medium">
                      {getGenreEmoji(genre)} {genre}
                    </span>
                  )) : film.genres && (
                    <span className="rounded-full bg-purple-500/20 px-3 py-1.5 ring-1 ring-purple-400/30 backdrop-blur-sm text-[11px] sm:text-xs text-purple-200 font-medium">
                      {getGenreEmoji(film.genres)} {film.genres}
                    </span>
                  )}
                </div>
              </div>

              {/* Target Audience row with heading on same line */}
              {film.targetAudiences && film.targetAudiences.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide shrink-0">
                      Target Audience:
                    </h4>
                    {film.targetAudiences.map((audience, index) => (
                      <span key={index} className="rounded-full bg-amber-500/20 px-3 py-1.5 ring-1 ring-amber-400/30 backdrop-blur-sm text-[11px] sm:text-xs text-amber-200 font-medium">
                        {getTargetAudienceEmoji(audience)} {audience}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Logline (short synopsis) */}
              <p className="mb-4 text-sm sm:text-base text-white/90 leading-6 [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]">
                {film.logline ?? "ยังไม่มีเรื่องย่อ"}
              </p>

              {/* Activities small banners */}
              {film.afterScreenActivities && film.afterScreenActivities.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {film.afterScreenActivities.map((activity, index) => (
                    <span key={index} className="rounded-lg bg-gradient-to-r from-green-500/30 to-emerald-500/30 px-3 py-2 ring-1 ring-green-400/40 backdrop-blur-sm text-[11px] sm:text-xs text-green-100 font-medium uppercase tracking-wide">
                      {getActivityEmoji(activity)} {activity}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CTA buttons - bottom-right */}
          <div className="flex justify-end items-end p-4 sm:p-6 md:p-8">
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.hash = '#coming-soon';
                }}
                className="group relative overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:ring-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
              >
                <span className="relative z-10">ดูรายละเอียดภาพยนตร์</span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.hash = '#coming-soon';
                }}
                className="group relative overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:ring-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
              >
                <span className="relative z-10">ดูตารางการฉาย</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </button>
            </div>
          </div>
        </div>
      )}


      {/* bottom cap to mimic VHS plastic (kept subtle) */}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-black/40 backdrop-blur-[1px] ring-t-1 ring-white/10" />

      {/* hover glow */}
      <div 
        className="pointer-events-none absolute -inset-2 rounded-2xl opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60" 
        style={{ 
          background: "radial-gradient(60% 60% at 50% 90%, rgba(255,255,255,0.2), transparent 70%)" 
        }} 
      />
    </motion.article>
  );
}

function EmptyState(): JSX.Element {
  return (
    <div className="w-full rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
      ยังไม่มีภาพยนตร์ที่สถานะเป็นสาธารณะ
    </div>
  );
}

function LoadingSkeleton(): JSX.Element {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div 
          key={i} 
          className="w-27 sm:w-32 md:w-38 lg:w-43 shrink-0 rounded-xl bg-white/10 animate-pulse" 
          style={{ height: "32.4rem" }} 
        />
      ))}
    </div>
  );
}

// --- Main Section ---
interface OfficialSelectionShelfProps {
  className?: string;
}

export default function OfficialSelectionShelf({ className = "" }: OfficialSelectionShelfProps): JSX.Element {
  const [activeId, setActiveId] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Use real-time feature films hook with filters for public films
  const { films: featureFilms, loading, error } = useFeatureFilms(
    { publicationStatus: 'public' }, // Only get films with publicationStatus: 'public'
    true // Enable real-time updates
  );

  // Convert FeatureFilm[] to Film[] - filtering is now handled by the service layer
  const films = useMemo(() => {
    console.log('🎬 Processing films in OfficialSelectionShelf:', {
      featureFilmsCount: featureFilms?.length || 0,
      loading,
      error,
      hasFeatureFilms: !!featureFilms
    });

    if (error) {
      console.error('❌ Error in useFeatureFilms:', error);
      return null; // Return null to show error state
    }
    
    if (!featureFilms) {
      console.log('ℹ️ No feature films data available yet');
      return null; // Return null to show loading state
    }
    
    // Service layer already filters for publicationStatus: 'public', so just convert the data
    const convertedFilms = featureFilms.map(convertFeatureFilmToFilm);
    
    console.log('✅ Final converted films:', convertedFilms.length);
    return convertedFilms;
  }, [featureFilms, error, loading]);

  // ensure the active card scrolls into view
  useEffect(() => {
    if (!activeId) return;
    const el = document.getElementById(`spine-${activeId}`);
    el?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }, [activeId]);

  const handleCardToggle = useCallback((filmId: string) => {
    setActiveId((prev) => (prev === filmId ? null : filmId));
  }, []);

  const handleCardClick = useCallback((filmId: string) => {
    setActiveId((prev) => (prev === filmId ? null : filmId));
  }, []);

  return (
    <section className={`relative w-full py-12 sm:py-16 md:py-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <ShelfHeader />

        <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-zinc-900/20 p-6">
          <div className="pointer-events-none absolute inset-x-6 bottom-3 h-2 rounded-full bg-black/50" />

          {/* Shelf scroller - removed controls and header text */}
          <div
            ref={scrollerRef}
            className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth py-4 snap-x snap-mandatory"
          >
            {films === null && <LoadingSkeleton />}
            {error && (
              <div className="text-sm text-red-300">เกิดข้อผิดพลาดในการดึงข้อมูล: {error}</div>
            )}
            {films && films.length === 0 && <EmptyState />}
            {films && films.length > 0 && (
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
                    onToggle={() => handleCardToggle(film.id)} 
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

// --- Sample data ---
const SAMPLE_FILMS: Film[] = [
  {
    id: "1",
    title: "Halloween",
    titleTh: "ฮัลโลวีน",
    publicationStatus: "public",
    galleryUrls: [
      "https://images.unsplash.com/photo-1604079628040-94301bb21b93?q=80&w=1200&auto=format&fit=crop",
    ],
    genres: ["Horror", "Slasher"],
    runtimeMinutes: 91,
    logline: "ในคืนวันฮัลโลวีน เด็กหนุ่มที่เคยก่อเหตุสะเทือนขวัญกลับมาอีกครั้งเพื่อไล่ล่าเหยื่อรายใหม่",
    targetAudiences: ["J-Horror Fan", "Youth"],
    afterScreenActivities: ["qna", "talk"],
    category: "Official Selection",
    year: 1978,
  },
  {
    id: "2",
    title: "Halloween II",
    titleTh: "ฮัลโลวีน 2",
    publicationStatus: "public",
    galleryUrls: [
      "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?q=80&w=1200&auto=format&fit=crop",
    ],
    genres: ["Horror"],
    runtimeMinutes: 92,
    logline: "การตามล่าเดินหน้าต่อในโรงพยาบาลที่ดูเหมือนปลอดภัย แต่กลับกลายเป็นเขาวงกตแห่งความสยอง",
    targetAudiences: ["Cinephile", "J-Horror Fan"],
    afterScreenActivities: ["qna"],
    category: "CIFAN Premiere",
    year: 1981,
  },
  {
    id: "3",
    title: "Season of the Witch",
    titleTh: "ฤดูกาลแห่งแม่มด",
    publicationStatus: "public",
    galleryUrls: [
      "https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?q=80&w=1200&auto=format&fit=crop",
    ],
    genres: ["Horror", "Mystery"],
    runtimeMinutes: 98,
    logline: "คำสาปและหน้ากากลึกลับเชื่อมโยงกับแผนชั่วร้ายที่ค่อย ๆ เผยตัวในคืนปล่อยผี",
    targetAudiences: ["Art People", "Cinephile"],
    afterScreenActivities: ["talk", "education"],
    category: "Opening Film",
    year: 1982,
  },
  {
    id: "4",
    title: "Return of the Shape",
    titleTh: "การกลับมาของเงามืด",
    publicationStatus: "public",
    galleryUrls: [
      "https://images.unsplash.com/photo-1495562569060-2eec283d3391?q=80&w=1200&auto=format&fit=crop",
    ],
    genres: ["Horror", "Thriller"],
    runtimeMinutes: 95,
    logline: "เขากลับมาอีกครั้งพร้อมเงามืดที่ยาวนานกว่าเดิม เมืองเล็ก ๆ ต้องรวมพลังเอาตัวรอด",
    targetAudiences: ["Popcorn", "Youth"],
    afterScreenActivities: ["fanmeeting"],
    category: "Park Film",
    year: 1988,
  },
  {
    id: "5",
    title: "Revenge of Michael",
    titleTh: "การล้างแค้นของไมเคิล",
    publicationStatus: "public",
    galleryUrls: [
      "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=1200&auto=format&fit=crop",
    ],
    genres: ["Horror"],
    runtimeMinutes: 96,
    logline: "การล้างแค้นที่ไม่รู้จบทำให้ค่ำคืนกลายเป็นฝันร้ายที่ไม่มีใครตื่นได้",
    targetAudiences: ["J-Horror Fan"],
    afterScreenActivities: ["qna", "redcarpet"],
    category: "THAIMAX",
    year: 1989,
  },
  {
    id: "6",
    title: "Curse of the Mask",
    titleTh: "คำสาปแห่งหน้ากาก",
    publicationStatus: "public",
    galleryUrls: [
      "https://images.unsplash.com/photo-1501127122-f385ca6ddd9d?q=80&w=1200&auto=format&fit=crop",
    ],
    genres: ["Horror", "Mystery"],
    runtimeMinutes: 87,
    logline: "หน้ากากเก่าที่ถูกค้นพบปลุกคำสาปอันชั่วร้ายและอดีตที่ถูกฝัง",
    targetAudiences: ["Art People", "Novel Fan"],
    afterScreenActivities: ["talk"],
    category: "Closing Film",
    year: 1995,
  },
  {
    id: "7",
    title: "H20",
    titleTh: "เอช ทู โอ",
    publicationStatus: "public",
    galleryUrls: [
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
    ],
    genres: ["Horror", "Drama"],
    runtimeMinutes: 86,
    logline: "การเผชิญหน้าระหว่างอดีตกับปัจจุบันที่นำไปสู่การตัดสินใจครั้งสำคัญ",
    targetAudiences: ["Family", "Student"],
    afterScreenActivities: ["education"],
    category: "Nostalgia",
    year: 1998,
  },
];
