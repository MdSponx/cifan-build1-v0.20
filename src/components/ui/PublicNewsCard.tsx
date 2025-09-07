import React from 'react';
import { PublicNewsCardProps, NEWS_CATEGORY_OPTIONS } from '../../types/news.types';

const PublicNewsCard: React.FC<PublicNewsCardProps> = ({
  article,
  onView,
  language = 'en',
  showExcerpt = true,
  showAuthor = true,
  showDate = true,
  showCategories = true
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'th-TH', {
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
    return language === 'en' ? categoryOption?.label : categoryOption?.labelTh || categoryOption?.label;
  };

  const handleClick = () => {
    onView(article);
  };

  return (
    <article className="group cursor-pointer" onClick={handleClick}>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 hover:transform hover:scale-105">
        {/* Cover Image */}
        {article.coverImageUrl && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            
            {/* Categories Overlay */}
            {showCategories && article.categories.length > 0 && (
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {article.categories.slice(0, 2).map((category) => (
                  <span
                    key={category}
                    className={`px-2 py-1 text-xs font-medium rounded-full bg-${getCategoryColor(category)}-600 text-white`}
                  >
                    {getCategoryLabel(category)}
                  </span>
                ))}
                {article.categories.length > 2 && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-600 text-white">
                    +{article.categories.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Categories (if no cover image) */}
          {!article.coverImageUrl && showCategories && article.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.categories.slice(0, 3).map((category) => (
                <span
                  key={category}
                  className={`px-2 py-1 text-xs font-medium rounded-full bg-${getCategoryColor(category)}-600 text-white`}
                >
                  {getCategoryLabel(category)}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-blue-300 transition-colors">
            {article.title}
          </h3>

          {/* Excerpt */}
          {showExcerpt && (
            <p className="text-gray-300 text-sm mb-4 line-clamp-3">
              {article.shortDescription}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              {/* Author */}
              {showAuthor && (
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {article.authorName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{article.authorName}</span>
                </div>
              )}

              {/* Date */}
              {showDate && article.publishedAt && (
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(article.publishedAt)}</span>
                </div>
              )}
            </div>

            {/* View Count */}
            {article.viewCount > 0 && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{article.viewCount.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-white/10 text-gray-300 rounded-full"
                >
                  #{tag}
                </span>
              ))}
              {article.tags.length > 3 && (
                <span className="px-2 py-1 text-xs bg-white/10 text-gray-300 rounded-full">
                  +{article.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Read More Indicator */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            <span className="text-blue-400 text-sm font-medium group-hover:text-blue-300 transition-colors">
              Read More
            </span>
            <svg 
              className="w-4 h-4 text-blue-400 group-hover:text-blue-300 group-hover:translate-x-1 transition-all duration-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PublicNewsCard;
