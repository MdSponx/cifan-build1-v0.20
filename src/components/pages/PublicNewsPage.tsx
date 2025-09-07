import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { newsService } from '../../services/newsService';
import { NewsArticle, NewsCategory, NEWS_CATEGORY_OPTIONS } from '../../types/news.types';
import PublicNewsCard from '../ui/PublicNewsCard';

const PublicNewsPage: React.FC = () => {
  const { t } = useTranslation();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'all'>('all');
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = useCallback(async (category: NewsCategory | 'all', reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setArticles([]);
        setLastDoc(undefined);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const categoryFilter = category === 'all' ? undefined : category;
      const docToStartAfter = reset ? undefined : lastDoc;

      const response = await newsService.getPublishedArticles(
        categoryFilter,
        12,
        docToStartAfter
      );

      if (reset) {
        setArticles(response.articles);
      } else {
        setArticles(prev => [...prev, ...response.articles]);
      }

      setLastDoc(response.lastDoc);
      setHasMore(response.articles.length === 12);
      setError(null);
    } catch (err) {
      console.error('Error loading articles:', err);
      setError('Failed to load articles. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [lastDoc]);

  useEffect(() => {
    loadArticles(selectedCategory, true);
  }, [selectedCategory]);

  const handleCategoryChange = (category: NewsCategory | 'all') => {
    setSelectedCategory(category);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadArticles(selectedCategory, false);
    }
  };

  const handleViewArticle = (article: NewsArticle) => {
    // Increment view count
    newsService.incrementViews(article.id);
    // Navigate to article detail page using hash-based routing
    window.location.hash = `#news/${article.slug}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Hero Section */}
      <div className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            News & Articles
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Stay updated with the latest news, insights, and stories from the festival world
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            All Articles
          </button>
          {NEWS_CATEGORY_OPTIONS.map((category) => (
            <button
              key={category.value}
              onClick={() => handleCategoryChange(category.value)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category.value
                  ? `bg-${category.color}-600 text-white shadow-lg`
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8">
            <p className="text-red-400 text-center">{error}</p>
            <button
              onClick={() => loadArticles(selectedCategory, true)}
              className="mt-2 mx-auto block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {articles.length === 0 && !loading ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Articles Found</h3>
            <p className="text-gray-400">
              {selectedCategory === 'all' 
                ? 'No articles have been published yet.'
                : `No articles found in the ${selectedCategory} category.`
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <PublicNewsCard
                  key={article.id}
                  article={article}
                  onView={handleViewArticle}
                  showExcerpt={true}
                  showAuthor={true}
                  showDate={true}
                  showCategories={true}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    'Load More Articles'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PublicNewsPage;
