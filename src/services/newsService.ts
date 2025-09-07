import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  Timestamp,
  writeBatch,
  QueryDocumentSnapshot,
  serverTimestamp,
  deleteField
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebase';
import { 
  NewsArticle, 
  NewsFormData, 
  NewsFilters, 
  NewsSortOptions, 
  NewsListResponse,
  NewsFirestoreDoc,
  NewsAnalytics,
  NewsSearchResult,
  NewsStatus,
  NewsCategory,
  NewsImage,
  ActivityReference,
  FilmReference,
  generateSlug,
  generateSearchKeywords
} from '../types/news.types';

const NEWS_COLLECTION = 'news';
const IMAGES_STORAGE_PATH = 'news/images';

export class NewsService {
  private static instance: NewsService;

  static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  /**
   * Create a new news article
   */
  async createArticle(formData: NewsFormData, userId: string, authorName: string): Promise<NewsArticle> {
    console.log('Creating news article with data:', { 
      title: formData.title, 
      userId, 
      collection: NEWS_COLLECTION 
    });
    
    try {
      let coverImageUrl = '';
      let coverImagePath = '';
      const galleryImages: NewsImage[] = [];

      // Upload cover image if provided
      if (formData.coverImage) {
        console.log('Uploading cover image...');
        const result = await this.uploadNewsImage(formData.coverImage);
        coverImageUrl = result.downloadURL;
        coverImagePath = result.path;
        console.log('Cover image uploaded successfully:', coverImageUrl);
      }

      // Upload gallery images if provided
      if (formData.galleryImages && formData.galleryImages.length > 0) {
        console.log('Uploading gallery images...');
        for (let i = 0; i < formData.galleryImages.length; i++) {
          const file = formData.galleryImages[i];
          const result = await this.uploadNewsImage(file);
          galleryImages.push({
            id: `img_${Date.now()}_${i}`,
            url: result.downloadURL,
            path: result.path,
            altText: `Gallery image ${i + 1}`,
            isCover: false,
            sortOrder: i
          });
        }
        console.log('Gallery images uploaded successfully:', galleryImages.length);
      }

      // Generate slug from title
      const slug = await this.generateUniqueSlug(formData.title);

      // Fetch referenced activities and films data
      const referencedActivities = await this.fetchActivityReferences(formData.referencedActivities || []);
      const referencedFilms = await this.fetchFilmReferences(formData.referencedFilms || []);

      // Generate search keywords
      const searchKeywords = generateSearchKeywords(formData.title, formData.content, formData.tags);

      // Prepare article data for Firestore
      const articleData: any = {
        title: formData.title.trim(),
        slug,
        shortDescription: formData.shortDescription.trim(),
        content: formData.content.trim(),
        coverImageUrl: coverImageUrl || '',
        coverImagePath: coverImagePath || '',
        authorId: formData.authorId,
        authorName,
        status: formData.status,
        publishedAt: formData.status === 'published' ? serverTimestamp() : 
                     formData.publishedAt ? Timestamp.fromDate(new Date(formData.publishedAt)) : null,
        categories: formData.categories || [],
        tags: formData.tags || [],
        images: galleryImages || [],
        referencedActivities: referencedActivities || [],
        referencedFilms: referencedFilms || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        updatedBy: userId,
        viewCount: 0,
        metaTitle: formData.metaTitle?.trim() || formData.title.trim(),
        metaDescription: formData.metaDescription?.trim() || formData.shortDescription.trim(),
        searchKeywords: searchKeywords || []
      };

      console.log('Prepared article data for Firestore:', articleData);

      // Add to Firestore
      console.log('Adding document to Firestore collection:', NEWS_COLLECTION);
      const docRef = await addDoc(collection(db, NEWS_COLLECTION), articleData);
      console.log('Document added successfully with ID:', docRef.id);

      // Return the created article
      const createdArticle = this.convertFirestoreDocToArticle({
        id: docRef.id,
        ...articleData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      console.log('Article created successfully:', createdArticle);
      return createdArticle;
    } catch (error) {
      console.error('Error creating article:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          throw new Error('Permission denied. Please check your admin privileges.');
        } else if (error.message.includes('network')) {
          throw new Error('Network error. Please check your internet connection.');
        } else {
          throw new Error(`Failed to create article: ${error.message}`);
        }
      }
      
      throw new Error('Failed to create article due to an unknown error');
    }
  }

  /**
   * Get all articles with filtering, sorting, and pagination
   */
  async getArticles(
    filters?: NewsFilters,
    sortOptions?: NewsSortOptions,
    page = 1,
    pageSize = 12
  ): Promise<NewsListResponse> {
    try {
      let baseQuery = collection(db, NEWS_COLLECTION);
      let queryConstraints: any[] = [];

      // Apply filters
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          queryConstraints.push(where('status', '==', filters.status));
        }
        
        if (filters.categories && filters.categories.length > 0) {
          queryConstraints.push(where('categories', 'array-contains-any', filters.categories));
        }

        if (filters.tags && filters.tags.length > 0) {
          queryConstraints.push(where('tags', 'array-contains-any', filters.tags));
        }

        if (filters.authorId) {
          queryConstraints.push(where('authorId', '==', filters.authorId));
        }

        if (filters.dateRange) {
          if (filters.dateRange.start) {
            queryConstraints.push(where('publishedAt', '>=', Timestamp.fromDate(new Date(filters.dateRange.start))));
          }
          if (filters.dateRange.end) {
            queryConstraints.push(where('publishedAt', '<=', Timestamp.fromDate(new Date(filters.dateRange.end))));
          }
        }

        if (filters.hasReferences) {
          // This will be handled client-side as Firestore doesn't support complex array queries
        }
      }

      // Apply sorting
      if (sortOptions) {
        const direction = sortOptions.direction === 'desc' ? 'desc' : 'asc';
        queryConstraints.push(orderBy(sortOptions.field, direction));
      } else {
        // Default sort by published date (newest first)
        queryConstraints.push(orderBy('publishedAt', 'desc'));
      }

      // Create query with all constraints
      const q = query(baseQuery, ...queryConstraints);

      // Get total count for pagination
      const totalSnapshot = await getDocs(q);
      const total = totalSnapshot.size;

      // Apply pagination
      const offset = (page - 1) * pageSize;
      let paginatedQuery = q;
      
      if (offset > 0) {
        const offsetQuery = query(baseQuery, ...queryConstraints, limit(offset));
        const offsetSnapshot = await getDocs(offsetQuery);
        if (!offsetSnapshot.empty) {
          const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          paginatedQuery = query(baseQuery, ...queryConstraints, startAfter(lastDoc), limit(pageSize));
        } else {
          paginatedQuery = query(baseQuery, ...queryConstraints, limit(pageSize));
        }
      } else {
        paginatedQuery = query(baseQuery, ...queryConstraints, limit(pageSize));
      }

      const snapshot = await getDocs(paginatedQuery);
      let articles: NewsArticle[] = snapshot.docs.map(doc => 
        this.convertFirestoreDocToArticle({
          id: doc.id,
          ...doc.data()
        } as NewsFirestoreDoc)
      );

      // Apply client-side search filter for full-text search
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        articles = articles.filter(article =>
          article.title.toLowerCase().includes(searchTerm) ||
          article.shortDescription.toLowerCase().includes(searchTerm) ||
          article.content.toLowerCase().includes(searchTerm) ||
          article.authorName.toLowerCase().includes(searchTerm) ||
          article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Apply has references filter
      if (filters?.hasReferences) {
        articles = articles.filter(article => 
          article.referencedActivities.length > 0 || article.referencedFilms.length > 0
        );
      }

      return {
        articles,
        total: filters?.search || filters?.hasReferences ? articles.length : total,
        page,
        limit: pageSize,
        totalPages: Math.ceil((filters?.search || filters?.hasReferences ? articles.length : total) / pageSize),
        hasMore: page * pageSize < total
      };
    } catch (error) {
      console.error('Error fetching articles:', error);
      throw new Error('Failed to fetch articles');
    }
  }

  /**
   * Get published articles for public display
   */
  async getPublishedArticles(
    category?: NewsCategory,
    limitCount = 12,
    lastDoc?: QueryDocumentSnapshot
  ): Promise<{ articles: NewsArticle[]; lastDoc?: QueryDocumentSnapshot }> {
    try {
      let queryConstraints: any[] = [
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        limit(limitCount)
      ];

      if (category) {
        queryConstraints.unshift(where('categories', 'array-contains', category));
      }

      if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }

      const q = query(collection(db, NEWS_COLLECTION), ...queryConstraints);
      const snapshot = await getDocs(q);

      const articles = snapshot.docs.map(doc => 
        this.convertFirestoreDocToArticle({
          id: doc.id,
          ...doc.data()
        } as NewsFirestoreDoc)
      );

      return {
        articles,
        lastDoc: snapshot.docs[snapshot.docs.length - 1]
      };
    } catch (error) {
      console.error('Error fetching published articles:', error);
      return { articles: [] }; // Return empty array instead of throwing for public display
    }
  }

  /**
   * Get a single article by ID
   */
  async getArticleById(articleId: string): Promise<NewsArticle | null> {
    try {
      const docRef = doc(db, NEWS_COLLECTION, articleId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return this.convertFirestoreDocToArticle({
          id: docSnap.id,
          ...docSnap.data()
        } as NewsFirestoreDoc);
      }

      return null;
    } catch (error) {
      console.error('Error fetching article:', error);
      throw new Error('Failed to fetch article');
    }
  }

  /**
   * Get a single article by slug
   */
  async getArticleBySlug(slug: string): Promise<NewsArticle | null> {
    try {
      const q = query(
        collection(db, NEWS_COLLECTION),
        where('slug', '==', slug),
        limit(1)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return this.convertFirestoreDocToArticle({
          id: doc.id,
          ...doc.data()
        } as NewsFirestoreDoc);
      }

      return null;
    } catch (error) {
      console.error('Error fetching article by slug:', error);
      throw new Error('Failed to fetch article');
    }
  }

  /**
   * Update an existing article
   */
  async updateArticle(
    articleId: string, 
    formData: Partial<NewsFormData>, 
    userId: string,
    authorName?: string
  ): Promise<NewsArticle> {
    try {
      const docRef = doc(db, NEWS_COLLECTION, articleId);
      const currentDoc = await getDoc(docRef);

      if (!currentDoc.exists()) {
        throw new Error('Article not found');
      }

      const currentData = currentDoc.data() as NewsFirestoreDoc;
      let coverImageUrl = currentData.coverImageUrl;
      let coverImagePath = currentData.coverImagePath;
      let galleryImages = [...(currentData.images || [])];

      // Handle cover image update
      if (formData.coverImage) {
        // Delete old cover image if exists
        if (currentData.coverImagePath) {
          await this.deleteNewsImage(currentData.coverImagePath);
        }

        // Upload new cover image
        const result = await this.uploadNewsImage(formData.coverImage);
        coverImageUrl = result.downloadURL;
        coverImagePath = result.path;
      }

      // Handle gallery images update
      if (formData.galleryImages && formData.galleryImages.length > 0) {
        // Upload new gallery images
        for (let i = 0; i < formData.galleryImages.length; i++) {
          const file = formData.galleryImages[i];
          const result = await this.uploadNewsImage(file);
          galleryImages.push({
            id: `img_${Date.now()}_${i}`,
            url: result.downloadURL,
            path: result.path,
            altText: `Gallery image ${galleryImages.length + i + 1}`,
            isCover: false,
            sortOrder: galleryImages.length + i
          });
        }
      }

      // Handle existing images update
      if (formData.existingImages !== undefined) {
        // Remove deleted images from storage
        const existingImageIds = formData.existingImages.map(img => img.id);
        const imagesToDelete = galleryImages.filter(img => !existingImageIds.includes(img.id));
        
        for (const img of imagesToDelete) {
          await this.deleteNewsImage(img.path);
        }

        galleryImages = formData.existingImages;
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: serverTimestamp(),
        updatedBy: userId
      };

      // Only update provided fields
      if (formData.title !== undefined) {
        updateData.title = formData.title.trim();
        // Update slug if title changed
        if (formData.title.trim() !== currentData.title) {
          updateData.slug = await this.generateUniqueSlug(formData.title.trim(), articleId);
        }
      }
      
      if (formData.shortDescription !== undefined) updateData.shortDescription = formData.shortDescription.trim();
      if (formData.content !== undefined) updateData.content = formData.content.trim();
      if (formData.authorId !== undefined) updateData.authorId = formData.authorId;
      if (authorName !== undefined) updateData.authorName = authorName;
      if (formData.status !== undefined) {
        updateData.status = formData.status;
        // Update publishedAt when status changes to published
        if (formData.status === 'published' && currentData.status !== 'published') {
          updateData.publishedAt = serverTimestamp();
        }
      }
      if (formData.publishedAt !== undefined) {
        updateData.publishedAt = formData.publishedAt ? 
          Timestamp.fromDate(new Date(formData.publishedAt)) : null;
      }
      if (formData.categories !== undefined) updateData.categories = formData.categories;
      if (formData.tags !== undefined) updateData.tags = formData.tags;
      if (formData.metaTitle !== undefined) updateData.metaTitle = formData.metaTitle?.trim();
      if (formData.metaDescription !== undefined) updateData.metaDescription = formData.metaDescription?.trim();

      // Handle references update
      if (formData.referencedActivities !== undefined) {
        updateData.referencedActivities = await this.fetchActivityReferences(formData.referencedActivities);
      }
      if (formData.referencedFilms !== undefined) {
        updateData.referencedFilms = await this.fetchFilmReferences(formData.referencedFilms);
      }

      // Update image fields if changed
      if (formData.coverImage) {
        updateData.coverImageUrl = coverImageUrl;
        updateData.coverImagePath = coverImagePath;
      }
      if (formData.galleryImages || formData.existingImages !== undefined) {
        updateData.images = galleryImages;
      }

      // Update search keywords if content changed
      if (formData.title !== undefined || formData.content !== undefined || formData.tags !== undefined) {
        const title = formData.title?.trim() || currentData.title;
        const content = formData.content?.trim() || currentData.content;
        const tags = formData.tags || currentData.tags;
        updateData.searchKeywords = generateSearchKeywords(title, content, tags);
      }

      // Update in Firestore
      console.log('Updating article with data:', updateData);
      await updateDoc(docRef, updateData);
      console.log('Article updated successfully');

      // Return updated article
      const updatedDoc = await getDoc(docRef);
      return this.convertFirestoreDocToArticle({
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as NewsFirestoreDoc);
    } catch (error) {
      console.error('Error updating article:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          throw new Error('Permission denied. Please check your admin privileges.');
        } else if (error.message.includes('network')) {
          throw new Error('Network error. Please check your internet connection.');
        } else {
          throw new Error(`Failed to update article: ${error.message}`);
        }
      }
      
      throw new Error('Failed to update article due to an unknown error');
    }
  }

  /**
   * Delete an article
   */
  async deleteArticle(articleId: string): Promise<void> {
    try {
      const docRef = doc(db, NEWS_COLLECTION, articleId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Article not found');
      }

      const articleData = docSnap.data() as NewsFirestoreDoc;

      // Delete associated images
      if (articleData.coverImagePath) {
        await this.deleteNewsImage(articleData.coverImagePath);
      }

      if (articleData.images && articleData.images.length > 0) {
        for (const image of articleData.images) {
          await this.deleteNewsImage(image.path);
        }
      }

      // Delete from Firestore
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting article:', error);
      throw new Error('Failed to delete article');
    }
  }

  /**
   * Bulk update articles
   */
  async bulkUpdateArticles(
    articleIds: string[], 
    updates: Partial<NewsFirestoreDoc>,
    userId: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      };

      articleIds.forEach(articleId => {
        const docRef = doc(db, NEWS_COLLECTION, articleId);
        batch.update(docRef, updateData);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating articles:', error);
      throw new Error('Failed to bulk update articles');
    }
  }

  /**
   * Bulk delete articles
   */
  async bulkDeleteArticles(articleIds: string[]): Promise<void> {
    try {
      // Get all articles first to delete their images
      const articles = await Promise.all(
        articleIds.map(id => this.getArticleById(id))
      );

      // Delete images in parallel
      await Promise.all(
        articles
          .filter(article => article)
          .map(async (article) => {
            const promises: Promise<void>[] = [];
            
            // Delete cover image
            if (article!.coverImageUrl) {
              const coverImagePath = this.extractImagePathFromUrl(article!.coverImageUrl);
              promises.push(this.deleteNewsImage(coverImagePath));
            }

            // Delete gallery images
            if (article!.images && article!.images.length > 0) {
              article!.images.forEach(image => {
                promises.push(this.deleteNewsImage(image.path));
              });
            }

            return Promise.all(promises);
          })
      );

      // Delete from Firestore using batch
      const batch = writeBatch(db);
      articleIds.forEach(articleId => {
        const docRef = doc(db, NEWS_COLLECTION, articleId);
        batch.delete(docRef);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk deleting articles:', error);
      throw new Error('Failed to bulk delete articles');
    }
  }

  /**
   * Duplicate an article
   */
  async duplicateArticle(articleId: string, userId: string, authorName: string): Promise<NewsArticle> {
    try {
      const original = await this.getArticleById(articleId);
      if (!original) {
        throw new Error('Original article not found');
      }

      // Create duplicate with modifications
      const duplicateData: NewsFormData = {
        title: `${original.title} (Copy)`,
        shortDescription: original.shortDescription,
        content: original.content,
        authorId: original.authorId,
        status: 'draft', // Always start as draft
        categories: [...original.categories],
        tags: [...original.tags],
        coverImage: null, // Don't duplicate images directly
        galleryImages: [],
        existingImages: [],
        referencedActivities: original.referencedActivities.map(ref => ref.id),
        referencedFilms: original.referencedFilms.map(ref => ref.id),
        metaTitle: original.metaTitle,
        metaDescription: original.metaDescription
      };

      return this.createArticle(duplicateData, userId, authorName);
    } catch (error) {
      console.error('Error duplicating article:', error);
      throw new Error('Failed to duplicate article');
    }
  }

  /**
   * Search articles with advanced text search
   */
  async searchArticles(
    searchTerm: string, 
    filters?: Omit<NewsFilters, 'search'>,
    limitCount = 20
  ): Promise<NewsSearchResult> {
    try {
      // Get all articles that match other filters
      const response = await this.getArticles(filters, undefined, 1, 1000); // Get large set for search
      
      const searchTermLower = searchTerm.toLowerCase();
      const matchedArticles = response.articles.filter(article => {
        // Search in multiple fields
        const searchableText = [
          article.title,
          article.shortDescription,
          article.content.replace(/<[^>]*>/g, ''), // Remove HTML tags
          article.authorName,
          ...article.tags,
          ...article.categories
        ].join(' ').toLowerCase();

        return searchableText.includes(searchTermLower);
      });

      // Generate search suggestions based on partial matches
      const suggestions = this.generateSearchSuggestions(searchTerm, response.articles);

      return {
        articles: matchedArticles.slice(0, limitCount),
        totalResults: matchedArticles.length,
        searchTerm,
        suggestions
      };
    } catch (error) {
      console.error('Error searching articles:', error);
      throw new Error('Failed to search articles');
    }
  }

  /**
   * Get news analytics for dashboard
   */
  async getNewsAnalytics(): Promise<NewsAnalytics> {
    try {
      const snapshot = await getDocs(collection(db, NEWS_COLLECTION));
      const articles = snapshot.docs.map(doc => 
        this.convertFirestoreDocToArticle({
          id: doc.id,
          ...doc.data()
        } as NewsFirestoreDoc)
      );

      // Calculate status distribution
      const articlesByStatus: Record<NewsStatus, number> = {
        draft: 0,
        published: 0,
        scheduled: 0,
        archived: 0
      };

      // Calculate category distribution
      const articlesByCategory: Record<NewsCategory, number> = {
        news: 0,
        article: 0,
        critic: 0,
        blog: 0
      };

      let totalViews = 0;
      const tagCounts: Record<string, number> = {};
      const authorStats: Record<string, { name: string; count: number; views: number }> = {};
      const monthlyData: Record<string, { published: number; views: number }> = {};

      articles.forEach(article => {
        // Status counts
        articlesByStatus[article.status]++;

        // Category counts
        article.categories.forEach(category => {
          articlesByCategory[category]++;
        });

        // View counts
        totalViews += article.viewCount;

        // Tag popularity
        article.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });

        // Author stats
        if (!authorStats[article.authorId]) {
          authorStats[article.authorId] = {
            name: article.authorName,
            count: 0,
            views: 0
          };
        }
        authorStats[article.authorId].count++;
        authorStats[article.authorId].views += article.viewCount;

        // Monthly trends (based on published date)
        if (article.publishedAt) {
          const publishedMonth = new Date(article.publishedAt).toISOString().slice(0, 7); // YYYY-MM
          if (!monthlyData[publishedMonth]) {
            monthlyData[publishedMonth] = { published: 0, views: 0 };
          }
          monthlyData[publishedMonth].published++;
          monthlyData[publishedMonth].views += article.viewCount;
        }
      });

      // Calculate derived metrics
      const totalArticles = articles.length;
      const averageViewsPerArticle = totalArticles > 0 ? Math.round(totalViews / totalArticles) : 0;
      const currentMonth = new Date().toISOString().slice(0, 7);
      const publishedThisMonth = monthlyData[currentMonth]?.published || 0;

      // Popular tags (top 10)
      const popularTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top authors (top 10)
      const topAuthors = Object.entries(authorStats)
        .map(([authorId, stats]) => ({
          authorId,
          authorName: stats.name,
          articleCount: stats.count,
          totalViews: stats.views
        }))
        .sort((a, b) => b.articleCount - a.articleCount)
        .slice(0, 10);

      // Monthly trends (last 12 months)
      const monthlyTrends = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          articlesPublished: data.published,
          totalViews: data.views,
          averageViews: data.published > 0 ? Math.round(data.views / data.published) : 0
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12);

      return {
        totalArticles,
        articlesByStatus,
        articlesByCategory,
        totalViews,
        averageViewsPerArticle,
        publishedThisMonth,
        popularTags,
        topAuthors,
        monthlyTrends
      };
    } catch (error) {
      console.error('Error fetching news analytics:', error);
      throw new Error('Failed to fetch news analytics');
    }
  }

  /**
   * Increment article view count
   */
  async incrementViews(articleId: string): Promise<void> {
    try {
      const docRef = doc(db, NEWS_COLLECTION, articleId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentViews = docSnap.data().viewCount || 0;
        await updateDoc(docRef, {
          viewCount: currentViews + 1,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
      // Don't throw error for view counting
    }
  }

  /**
   * Private helper methods
   */
  private async uploadNewsImage(file: File): Promise<{ downloadURL: string; path: string }> {
    try {
      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

      if (file.size > maxSize) {
        throw new Error('Image file size must be less than 5MB');
      }

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPEG, PNG, and WebP images are allowed');
      }

      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const path = `${IMAGES_STORAGE_PATH}/${fileName}`;
      const storageRef = ref(storage, path);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return { downloadURL, path };
    } catch (error) {
      console.error('Error uploading news image:', error);
      throw error;
    }
  }

  private async deleteNewsImage(imagePath: string): Promise<void> {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
    } catch (error) {
      // Log error but don't throw - image might already be deleted
      console.warn('Error deleting news image:', error);
    }
  }

  private extractImagePathFromUrl(imageUrl: string): string {
    try {
      // Extract path from Firebase Storage URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      if (pathMatch) {
        return decodeURIComponent(pathMatch[1]);
      }
      return imageUrl; // Fallback to original URL
    } catch (error) {
      return imageUrl; // Fallback to original URL
    }
  }

  private async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    let baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const q = query(
        collection(db, NEWS_COLLECTION),
        where('slug', '==', slug),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      // If no document found, or the found document is the one we're updating
      if (snapshot.empty || (excludeId && snapshot.docs[0].id === excludeId)) {
        return slug;
      }
      
      // Generate new slug with counter
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  private async fetchActivityReferences(activityIds: string[]): Promise<ActivityReference[]> {
    if (!activityIds || activityIds.length === 0) return [];

    try {
      const references: ActivityReference[] = [];
      
      // Fetch activities in batches (Firestore 'in' query limit is 10)
      const batchSize = 10;
      for (let i = 0; i < activityIds.length; i += batchSize) {
        const batch = activityIds.slice(i, i + batchSize);
        const q = query(
          collection(db, 'activities'),
          where('__name__', 'in', batch)
        );
        const snapshot = await getDocs(q);
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          references.push({
            id: doc.id,
            name: data.name,
            eventDate: data.eventDate,
            venueName: data.venueName
          });
        });
      }
      
      return references;
    } catch (error) {
      console.error('Error fetching activity references:', error);
      return [];
    }
  }

  private async fetchFilmReferences(filmIds: string[]): Promise<FilmReference[]> {
    if (!filmIds || filmIds.length === 0) return [];

    try {
      const references: FilmReference[] = [];
      
      // Fetch films in batches (Firestore 'in' query limit is 10)
      const batchSize = 10;
      for (let i = 0; i < filmIds.length; i += batchSize) {
        const batch = filmIds.slice(i, i + batchSize);
        const q = query(
          collection(db, 'featureFilms'),
          where('__name__', 'in', batch)
        );
        const snapshot = await getDocs(q);
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          references.push({
            id: doc.id,
            title: data.title,
            releaseYear: data.releaseYear,
            director: data.director
          });
        });
      }
      
      return references;
    } catch (error) {
      console.error('Error fetching film references:', error);
      return [];
    }
  }

  private generateSearchSuggestions(searchTerm: string, articles: NewsArticle[]): string[] {
    const suggestions = new Set<string>();
    const searchTermLower = searchTerm.toLowerCase();

    articles.forEach(article => {
      // Add partial matches from article titles
      if (article.title.toLowerCase().includes(searchTermLower)) {
        suggestions.add(article.title);
      }

      // Add matching tags
      article.tags.forEach(tag => {
        if (tag.toLowerCase().includes(searchTermLower)) {
          suggestions.add(tag);
        }
      });

      // Add matching categories
      article.categories.forEach(category => {
        if (category.toLowerCase().includes(searchTermLower)) {
          suggestions.add(category);
        }
      });

      // Add matching author names
      if (article.authorName.toLowerCase().includes(searchTermLower)) {
        suggestions.add(article.authorName);
      }
    });

    return Array.from(suggestions).slice(0, 5); // Return top 5 suggestions
  }

  private convertFirestoreDocToArticle(doc: NewsFirestoreDoc): NewsArticle {
    return {
      id: doc.id,
      title: doc.title,
      slug: doc.slug,
      shortDescription: doc.shortDescription,
      content: doc.content,
      coverImageUrl: doc.coverImageUrl,
      coverImagePath: doc.coverImagePath,
      authorId: doc.authorId,
      authorName: doc.authorName,
      status: doc.status,
      publishedAt: doc.publishedAt?.toDate ? doc.publishedAt.toDate().toISOString() : undefined,
      categories: doc.categories,
      tags: doc.tags,
      images: doc.images || [],
      referencedActivities: doc.referencedActivities || [],
      referencedFilms: doc.referencedFilms || [],
      createdAt: doc.createdAt?.toDate ? doc.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt?.toDate ? doc.updatedAt.toDate().toISOString() : new Date().toISOString(),
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy,
      viewCount: doc.viewCount || 0,
      metaTitle: doc.metaTitle,
      metaDescription: doc.metaDescription
    };
  }
}

// Export singleton instance
export const newsService = NewsService.getInstance();
export default newsService;
