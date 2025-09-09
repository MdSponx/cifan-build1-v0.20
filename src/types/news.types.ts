export interface NewsArticle {
  id: string;
  
  // Basic Information
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  coverImageUrl?: string;
  coverImagePath?: string; // Firebase Storage path for cleanup
  
  // Author and Status
  authorId: string;
  authorName: string;
  status: NewsStatus;
  publishedAt?: string; // ISO date string
  
  // Categorization
  categories: NewsCategory[];
  tags: string[];
  
  // Media Gallery
  images: NewsImage[];
  
  // References
  referencedActivities: ActivityReference[];
  referencedFilms: FilmReference[];
  
  // System fields
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy: string; // User UID
  updatedBy: string; // User UID
  
  // Statistics
  viewCount: number;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
}

export type NewsStatus = 'draft' | 'published' | 'scheduled' | 'archived';

export type NewsCategory = 'news' | 'article' | 'critic' | 'blog';

export interface NewsImage {
  id: string;
  url: string;
  path: string; // Firebase Storage path
  altText: string;
  isCover: boolean;
  sortOrder: number;
}

export interface ActivityReference {
  id: string;
  name: string;
  eventDate: string;
  venueName: string;
}

export interface FilmReference {
  id: string;
  title: string;
  releaseYear?: number;
  director?: string;
}

export interface NewsFormData {
  // Basic Information
  title: string;
  shortDescription: string;
  content: string;
  authorId: string;
  status: NewsStatus;
  publishedAt?: string; // ISO date string for scheduled posts
  
  // Categorization
  categories: NewsCategory[];
  tags: string[];
  
  // Media
  coverImage: File | null;
  galleryImages?: File[]; // New files to upload
  galleryUrls?: string[]; // New URLs added manually
  existingImages: NewsImage[]; // Existing images for reordering/editing
  deletedImageIds?: string[]; // IDs of images to delete
  galleryCoverIndex?: number; // Index of the cover image in the gallery
  
  // References
  referencedActivities: string[]; // Activity IDs
  referencedFilms: string[]; // Film IDs
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
}

// Additional interface for gallery management
export interface NewsGalleryUpdate {
  newFiles: File[];
  newUrls: string[];
  existingImages: NewsImage[];
  deletedImageIds: string[];
  coverIndex?: number;
}

export interface NewsFilters {
  search?: string;
  status?: NewsStatus | 'all';
  categories?: NewsCategory[];
  tags?: string[];
  authorId?: string;
  dateRange?: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  hasReferences?: boolean;
}

export interface NewsSortOptions {
  field: 'title' | 'publishedAt' | 'createdAt' | 'updatedAt' | 'viewCount' | 'authorName';
  direction: 'asc' | 'desc';
}

// Category options with labels and colors
export const NEWS_CATEGORY_OPTIONS = [
  {
    value: 'news' as NewsCategory,
    label: 'News',
    labelTh: 'ข่าว',
    color: 'blue',
    description: 'Breaking news and announcements',
    descriptionTh: 'ข่าวด่วนและประกาศ'
  },
  {
    value: 'article' as NewsCategory,
    label: 'Article',
    labelTh: 'บทความ',
    color: 'green',
    description: 'In-depth features and analysis',
    descriptionTh: 'บทความเชิงลึกและการวิเคราะห์'
  },
  {
    value: 'critic' as NewsCategory,
    label: 'Critic',
    labelTh: 'วิจารณ์',
    color: 'purple',
    description: 'Reviews and critiques',
    descriptionTh: 'บทวิจารณ์และการวิพากษ์'
  },
  {
    value: 'blog' as NewsCategory,
    label: 'Blog',
    labelTh: 'บล็อก',
    color: 'orange',
    description: 'Personal opinions and behind-the-scenes',
    descriptionTh: 'ความคิดเห็นส่วนตัวและเบื้องหลัง'
  }
];

// Status options with labels and colors
export const NEWS_STATUS_OPTIONS = [
  {
    value: 'draft' as NewsStatus,
    label: 'Draft',
    labelTh: 'ร่าง',
    color: 'gray',
    description: 'Article is being prepared',
    descriptionTh: 'กำลังเตรียมบทความ'
  },
  {
    value: 'published' as NewsStatus,
    label: 'Published',
    labelTh: 'เผยแพร่แล้ว',
    color: 'green',
    description: 'Article is live and visible to public',
    descriptionTh: 'บทความเผยแพร่และมองเห็นได้สาธารณะ'
  },
  {
    value: 'scheduled' as NewsStatus,
    label: 'Scheduled',
    labelTh: 'กำหนดเวลา',
    color: 'yellow',
    description: 'Article is scheduled for future publication',
    descriptionTh: 'บทความกำหนดเผยแพร่ในอนาคต'
  },
  {
    value: 'archived' as NewsStatus,
    label: 'Archived',
    labelTh: 'เก็บถาวร',
    color: 'red',
    description: 'Article is archived and not visible',
    descriptionTh: 'บทความถูกเก็บถาวรและไม่แสดง'
  }
];

// API Response types
export interface NewsListResponse {
  articles: NewsArticle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface NewsCreateRequest {
  article: Omit<NewsArticle, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'viewCount' | 'slug'>;
  coverImageFile?: File;
  galleryImageFiles?: File[];
}

export interface NewsUpdateRequest {
  id: string;
  article: Partial<Omit<NewsArticle, 'id' | 'createdAt' | 'createdBy' | 'viewCount' | 'slug'>>;
  coverImageFile?: File;
  galleryImageFiles?: File[];
}

export interface NewsDeleteRequest {
  id: string;
}

export interface BulkNewsRequest {
  articleIds: string[];
  action: 'delete' | 'publish' | 'archive' | 'duplicate';
  updates?: Partial<NewsFormData>;
}

// Component Props types
export interface NewsFormProps {
  article?: NewsArticle;
  onSubmit: (formData: NewsFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
  errors?: NewsValidationErrors;
}

export interface NewsGalleryProps {
  articles?: NewsArticle[];
  onCreateNew: () => void;
  onEditArticle: (article: NewsArticle) => void;
  onViewArticle: (article: NewsArticle) => void;
  onDeleteArticle: (articleId: string) => void;
  onDuplicateArticle: (article: NewsArticle) => void;
  onBulkAction: (articleIds: string[], action: string) => void;
  isLoading?: boolean;
  filters?: NewsFilters;
  onFiltersChange?: (filters: NewsFilters) => void;
}

export interface NewsCardProps {
  article: NewsArticle;
  onEdit: (article: NewsArticle) => void;
  onView: (article: NewsArticle) => void;
  onDelete: (articleId: string) => void;
  onDuplicate: (article: NewsArticle) => void;
  onSelect?: (articleId: string, selected: boolean) => void;
  isSelected?: boolean;
  showActions?: boolean;
  showBulkSelect?: boolean;
  language?: 'en' | 'th';
}

export interface PublicNewsCardProps {
  article: NewsArticle;
  onView: (article: NewsArticle) => void;
  language?: 'en' | 'th';
  showExcerpt?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showCategories?: boolean;
}

export interface NewsFiltersProps {
  filters: NewsFilters;
  onFiltersChange: (filters: NewsFilters) => void;
  availableAuthors: Array<{ id: string; name: string }>;
  availableTags: string[];
  onReset: () => void;
  isLoading?: boolean;
}

// Validation types
export interface NewsValidationErrors {
  title?: string;
  shortDescription?: string;
  content?: string;
  authorId?: string;
  publishedAt?: string;
  categories?: string;
  tags?: string;
  coverImage?: string;
  galleryImages?: string;
  referencedActivities?: string;
  referencedFilms?: string;
  metaTitle?: string;
  metaDescription?: string;
  general?: string;
}

// Hook types
export interface UseNewsReturn {
  articles: NewsArticle[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: NewsFilters;
  sortOptions: NewsSortOptions;
  
  // Actions
  fetchArticles: () => Promise<void>;
  createArticle: (formData: NewsFormData) => Promise<NewsArticle>;
  updateArticle: (id: string, formData: Partial<NewsFormData>) => Promise<NewsArticle>;
  deleteArticle: (id: string) => Promise<void>;
  duplicateArticle: (article: NewsArticle) => Promise<NewsArticle>;
  bulkActions: (articleIds: string[], action: string) => Promise<void>;
  
  // Filters and sorting
  setFilters: (filters: NewsFilters) => void;
  setSortOptions: (sortOptions: NewsSortOptions) => void;
  setCurrentPage: (page: number) => void;
  resetFilters: () => void;
  refreshData: () => Promise<void>;
}

// Analytics types
export interface NewsAnalytics {
  totalArticles: number;
  articlesByStatus: Record<NewsStatus, number>;
  articlesByCategory: Record<NewsCategory, number>;
  totalViews: number;
  averageViewsPerArticle: number;
  publishedThisMonth: number;
  popularTags: Array<{ tag: string; count: number }>;
  topAuthors: Array<{ authorId: string; authorName: string; articleCount: number; totalViews: number }>;
  monthlyTrends: Array<{
    month: string;
    articlesPublished: number;
    totalViews: number;
    averageViews: number;
  }>;
}

// Database/Firestore document structure
export interface NewsFirestoreDoc {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  coverImageUrl?: string;
  coverImagePath?: string;
  authorId: string;
  authorName: string;
  status: NewsStatus;
  publishedAt?: any; // Firestore Timestamp
  categories: NewsCategory[];
  tags: string[];
  images: NewsImage[];
  referencedActivities: ActivityReference[];
  referencedFilms: FilmReference[];
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  createdBy: string;
  updatedBy: string;
  viewCount: number;
  metaTitle?: string;
  metaDescription?: string;
  searchKeywords?: string[]; // For full-text search
}

// Utility types
export interface NewsSearchResult {
  articles: NewsArticle[];
  totalResults: number;
  searchTerm: string;
  suggestions?: string[];
}

export interface NewsExportData {
  article: NewsArticle;
  viewCount: number;
  publishStatus: 'published' | 'draft' | 'scheduled' | 'archived';
  daysSincePublished?: number;
}

// Form validation helpers
export const NEWS_VALIDATION_RULES = {
  title: {
    required: true,
    minLength: 5,
    maxLength: 200
  },
  shortDescription: {
    required: true,
    minLength: 20,
    maxLength: 300
  },
  content: {
    required: true,
    minLength: 100,
    maxLength: 50000
  },
  authorId: {
    required: true
  },
  categories: {
    required: true,
    minItems: 1,
    maxItems: 3
  },
  tags: {
    required: false,
    maxItems: 10
  },
  coverImage: {
    required: false,
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  galleryImages: {
    required: false,
    maxCount: 10,
    maxSize: 5 * 1024 * 1024, // 5MB per image
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  metaTitle: {
    required: false,
    maxLength: 60
  },
  metaDescription: {
    required: false,
    maxLength: 160
  }
};

// Default tags for news articles
export const DEFAULT_NEWS_TAGS = [
  // Festival related
  'Festival News',
  'Awards',
  'Announcements',
  'Press Release',
  'Behind the Scenes',
  
  // Film industry
  'Film Industry',
  'Directors',
  'Actors',
  'Producers',
  'Screenwriters',
  'Cinematography',
  
  // Event types
  'Screenings',
  'Premieres',
  'Workshops',
  'Panels',
  'Masterclasses',
  'Networking',
  
  // Film categories
  'Feature Films',
  'Short Films',
  'Documentaries',
  'Animation',
  'International Films',
  'Local Films',
  
  // Topics
  'Interviews',
  'Reviews',
  'Analysis',
  'Trends',
  'Technology',
  'Distribution',
  'Funding',
  'Education'
];

// Slug generation helper
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Search keywords generation helper
export const generateSearchKeywords = (title: string, content: string, tags: string[]): string[] => {
  const keywords = new Set<string>();
  
  // Add words from title (higher weight)
  title.toLowerCase().split(/\s+/).forEach(word => {
    if (word.length > 2) keywords.add(word);
  });
  
  // Add words from content
  const contentWords = content.toLowerCase().replace(/<[^>]*>/g, '').split(/\s+/);
  contentWords.forEach(word => {
    if (word.length > 3) keywords.add(word);
  });
  
  // Add tags
  tags.forEach(tag => {
    keywords.add(tag.toLowerCase());
  });
  
  return Array.from(keywords).slice(0, 50); // Limit to 50 keywords
};
