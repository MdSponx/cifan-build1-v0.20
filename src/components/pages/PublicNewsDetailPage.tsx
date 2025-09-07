import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { newsService } from '../../services/newsService';
import { NewsArticle, NEWS_CATEGORY_OPTIONS } from '../../types/news.types';
import PublicNewsCard from '../ui/PublicNewsCard';

interface PublicNewsDetailPageProps {
  slug: string;
  onNavigateBack: () => void;
}

const PublicNewsDetailPage: React.FC<PublicNewsDetailPageProps> = ({ slug, onNavigateBack }) => {
  const { t } = useTranslation();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (slug) {
      loadArticle(slug);
    }
  }, [slug]);

  const loadArticle = async (articleSlug: string) => {
    try {
      setLoading(true);
      const articleData = await newsService.getArticleBySlug(articleSlug);
      
      if (!articleData) {
        setError('Article not found');
        return;
      }

      if (articleData.status !== 'published') {
        setError('Article not available');
        return;
      }

      setArticle(articleData);
      
      // Increment view count
      newsService.incrementViews(articleData.id);

      // Load related articles
      loadRelatedArticles(articleData);
      
      setError(null);
    } catch (err) {
      console.error('Error loading article:', err);
      setError('Failed to load article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedArticles = async (currentArticle: NewsArticle) => {
    try {
      // Get articles from the same categories
      const category = currentArticle.categories[0];
      const response = await newsService.getPublishedArticles(category, 4);
      
      // Filter out the current article and limit to 3
      const related = response.articles
        .filter(a => a.id !== currentArticle.id)
        .slice(0, 3);
      
      setRelatedArticles(related);
    } catch (err) {
      console.error('Error loading related articles:', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const categoryOption = NEWS_CATEGORY_OPTIONS.find(opt => opt.value === category);
    return categoryOption?.color || 'gray';
  };

  const getCategoryLabel = (category: string) => {
    const categoryOption = NEWS_CATEGORY_OPTIONS.find(opt => opt.value === category);
    return categoryOption?.label || category;
  };

  const handleViewRelatedArticle = (relatedArticle: NewsArticle) => {
    window.location.hash = `#news/${relatedArticle.slug}`;
  };

  const openImageLightbox = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!article || selectedImageIndex === null) return;
    
    const images = article.images;
    if (direction === 'prev') {
      setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1);
    } else {
      setSelectedImageIndex(selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📰</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            {error || 'Article Not Found'}
          </h2>
          <button
            onClick={onNavigateBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to News
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Hero Section with Cover Image */}
      {article.coverImageUrl && (
        <div className="relative h-96 overflow-hidden">
          <img
            src={article.coverImageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          
          {/* Back Button */}
          <button
            onClick={onNavigateBack}
            className="absolute top-8 left-8 flex items-center space-x-2 px-4 py-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to News</span>
          </button>

          {/* Categories */}
          <div className="absolute top-8 right-8 flex flex-wrap gap-2">
            {article.categories.map((category) => (
              <span
                key={category}
                className={`px-3 py-1 text-sm font-medium rounded-full bg-${getCategoryColor(category)}-600 text-white`}
              >
                {getCategoryLabel(category)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button (if no cover image) */}
        {!article.coverImageUrl && (
          <button
            onClick={() => navigate('/news')}
            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-8 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to News</span>
          </button>
        )}

        {/* Categories (if no cover image) */}
        {!article.coverImageUrl && (
          <div className="flex flex-wrap gap-2 mb-6">
            {article.categories.map((category) => (
              <span
                key={category}
                className={`px-3 py-1 text-sm font-medium rounded-full bg-${getCategoryColor(category)}-600 text-white`}
              >
                {getCategoryLabel(category)}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          {article.title}
        </h1>

        {/* Meta Information */}
        <div className="flex items-center space-x-6 text-gray-400 mb-8 pb-8 border-b border-white/10">
          {/* Author */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {article.authorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">{article.authorName}</p>
              <p className="text-sm">Author</p>
            </div>
          </div>

          {/* Date */}
          {article.publishedAt && (
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(article.publishedAt)}</span>
            </div>
          )}

          {/* View Count */}
          {article.viewCount > 0 && (
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{article.viewCount.toLocaleString()} views</span>
            </div>
          )}
        </div>

        {/* Short Description */}
        <div className="text-xl text-gray-300 mb-8 leading-relaxed">
          {article.shortDescription}
        </div>

        {/* Article Content */}
        <div 
          className="prose prose-lg prose-invert max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Image Gallery */}
        {article.images && article.images.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-white mb-6">Gallery</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {article.images.map((image, index) => (
                <div
                  key={image.id}
                  className="relative aspect-video overflow-hidden rounded-lg cursor-pointer group"
                  onClick={() => openImageLightbox(index)}
                >
                  <img
                    src={image.url}
                    alt={image.altText}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-bold text-white mb-4">Tags</h3>
            <div className="flex flex-wrap gap-3">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 bg-white/10 text-gray-300 rounded-full hover:bg-white/20 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Referenced Content */}
        {(article.referencedActivities.length > 0 || article.referencedFilms.length > 0) && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-white mb-6">Related Content</h3>
            
            {/* Referenced Activities */}
            {article.referencedActivities.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-white mb-4">Related Activities</h4>
                <div className="space-y-3">
                  {article.referencedActivities.map((activity) => (
                    <div key={activity.id} className="bg-white/10 rounded-lg p-4">
                      <h5 className="font-medium text-white">{activity.name}</h5>
                      <p className="text-gray-400 text-sm">
                        {formatDate(activity.eventDate)} • {activity.venueName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Referenced Films */}
            {article.referencedFilms.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-white mb-4">Related Films</h4>
                <div className="space-y-3">
                  {article.referencedFilms.map((film) => (
                    <div key={film.id} className="bg-white/10 rounded-lg p-4">
                      <h5 className="font-medium text-white">{film.title}</h5>
                      <p className="text-gray-400 text-sm">
                        {film.releaseYear && `${film.releaseYear} • `}
                        {film.director && `Directed by ${film.director}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Social Sharing */}
        <div className="mb-12">
          <h3 className="text-xl font-bold text-white mb-4">Share this article</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                const url = window.location.href;
                const text = `Check out this article: ${article.title}`;
                if (navigator.share) {
                  navigator.share({ title: article.title, text, url });
                } else {
                  navigator.clipboard.writeText(url);
                  alert('Link copied to clipboard!');
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="bg-black/20 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-bold text-white mb-8 text-center">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedArticles.map((relatedArticle) => (
                <PublicNewsCard
                  key={relatedArticle.id}
                  article={relatedArticle}
                  onView={handleViewRelatedArticle}
                  showExcerpt={true}
                  showAuthor={true}
                  showDate={true}
                  showCategories={true}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {selectedImageIndex !== null && article.images && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={article.images[selectedImageIndex].url}
              alt={article.images[selectedImageIndex].altText}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation Buttons */}
            {article.images.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/50 text-white rounded-full text-sm">
              {selectedImageIndex + 1} / {article.images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicNewsDetailPage;
