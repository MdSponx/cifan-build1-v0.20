import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  Filter,
  Clock,
  Globe,
  EyeOff,
  MoreHorizontal,
  Copy,
  User,
  Tag,
  TrendingUp,
  FileText
} from 'lucide-react';
import { NewsArticle, NewsCategory, NewsStatus } from '../../types/news.types';
import { useTypography } from '../../utils/typography';
import { getTagColor } from '../../utils/tagColors';
import { newsService } from '../../services/newsService';

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  scheduled: 'bg-blue-100 text-blue-800',
  archived: 'bg-yellow-100 text-yellow-800'
};

const statusLabels = {
  draft: 'Draft',
  published: 'Published',
  scheduled: 'Scheduled',
  archived: 'Archived'
};

const categoryColors = {
  news: 'bg-blue-100 text-blue-800',
  article: 'bg-green-100 text-green-800',
  critic: 'bg-purple-100 text-purple-800',
  blog: 'bg-orange-100 text-orange-800'
};

const categoryLabels = {
  news: 'News',
  article: 'Article',
  critic: 'Critic',
  blog: 'Blog'
};

interface AdminNewsGalleryProps {
  articles?: NewsArticle[];
  filter?: string | null;
  onNavigate?: (route: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function AdminNewsGallery({
  articles: propArticles,
  filter,
  onNavigate,
  onRefresh,
  isLoading = false
}: AdminNewsGalleryProps = {}) {
  const { getClass } = useTypography();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Load articles on component mount
  useEffect(() => {
    if (propArticles) {
      setArticles(propArticles);
    } else {
      loadArticles();
    }
  }, [propArticles]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const result = await newsService.getArticles();
      setArticles(result.articles);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort articles
  const filteredArticles = articles
    .filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          article.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (article.authorName && article.authorName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || article.categories.includes(categoryFilter as NewsCategory);
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'published':
          return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
        case 'views':
          return (b.viewCount || 0) - (a.viewCount || 0);
        default:
          return 0;
      }
    });

  const handleSelectArticle = (articleId: string) => {
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(articleId)) {
      newSelected.delete(articleId);
    } else {
      newSelected.add(articleId);
    }
    setSelectedArticles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedArticles.size === filteredArticles.length) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(filteredArticles.map(a => a.id)));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewArticle = (articleSlug: string) => {
    // Navigate to public article detail page
    window.location.hash = `#news/${articleSlug}`;
  };

  const handleEditArticle = (articleId: string) => {
    console.log('Edit article:', articleId);
    onNavigate?.(`admin/news/edit/${articleId}`);
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      try {
        await newsService.deleteArticle(articleId);
        setArticles(prev => prev.filter(a => a.id !== articleId));
        setSelectedArticles(prev => {
          const newSet = new Set(prev);
          newSet.delete(articleId);
          return newSet;
        });
      } catch (error) {
        console.error('Error deleting article:', error);
        alert('Failed to delete article. Please try again.');
      }
    }
  };

  const handleDuplicateArticle = async (articleId: string) => {
    const originalArticle = articles.find(a => a.id === articleId);
    if (originalArticle) {
      try {
        const duplicatedArticle = await newsService.duplicateArticle(articleId);
        setArticles(prev => [duplicatedArticle, ...prev]);
      } catch (error) {
        console.error('Error duplicating article:', error);
        alert('Failed to duplicate article. Please try again.');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedArticles.size > 0 && confirm(`Delete ${selectedArticles.size} selected articles?`)) {
      try {
        await newsService.bulkDeleteArticles(Array.from(selectedArticles));
        setArticles(prev => prev.filter(a => !selectedArticles.has(a.id)));
        setSelectedArticles(new Set());
      } catch (error) {
        console.error('Error bulk deleting articles:', error);
        alert('Failed to delete articles. Please try again.');
      }
    }
  };

  const handleBulkStatusUpdate = async (newStatus: NewsStatus) => {
    if (selectedArticles.size > 0) {
      try {
        await newsService.bulkUpdateArticles(Array.from(selectedArticles), { status: newStatus });
        setArticles(prev => prev.map(article => 
          selectedArticles.has(article.id) 
            ? { ...article, status: newStatus, updatedAt: new Date().toISOString() }
            : article
        ));
        setSelectedArticles(new Set());
      } catch (error) {
        console.error('Error bulk updating articles:', error);
        alert('Failed to update articles. Please try again.');
      }
    }
  };

  const getArticleStats = () => {
    return {
      total: articles.length,
      published: articles.filter(a => a.status === 'published').length,
      drafts: articles.filter(a => a.status === 'draft').length,
      scheduled: articles.filter(a => a.status === 'scheduled').length,
      totalViews: articles.reduce((sum, a) => sum + (a.viewCount || 0), 0)
    };
  };

  const stats = getArticleStats();

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold text-white mb-2 ${getClass('header')}`}>News & Articles</h1>
          <p className={`text-white/70 ${getClass('subtitle')}`}>Manage all news articles, blogs, and editorial content</p>
        </div>
        
        <div className="mt-4 lg:mt-0">
          <button
            onClick={() => onNavigate?.('admin/news/create')}
            className="px-6 py-3 bg-gradient-to-r from-[#AA4626] to-[#FCB283] text-white rounded-lg hover:from-[#AA4626]/90 hover:to-[#FCB283]/90 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Create New Article
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="glass-container rounded-xl p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search articles, authors, content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-white/20 bg-white/10 text-white placeholder-white/60 rounded-lg focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all backdrop-blur-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-white/20 bg-white/10 text-white rounded-lg focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all appearance-none backdrop-blur-sm"
            >
              <option value="all" className="bg-gray-800 text-white">All Status</option>
              <option value="draft" className="bg-gray-800 text-white">Draft</option>
              <option value="published" className="bg-gray-800 text-white">Published</option>
              <option value="scheduled" className="bg-gray-800 text-white">Scheduled</option>
              <option value="archived" className="bg-gray-800 text-white">Archived</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-white/20 bg-white/10 text-white rounded-lg focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all appearance-none backdrop-blur-sm"
            >
              <option value="all" className="bg-gray-800 text-white">All Categories</option>
              <option value="news" className="bg-gray-800 text-white">News</option>
              <option value="article" className="bg-gray-800 text-white">Article</option>
              <option value="critic" className="bg-gray-800 text-white">Critic</option>
              <option value="blog" className="bg-gray-800 text-white">Blog</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 border border-white/20 bg-white/10 text-white rounded-lg focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all appearance-none backdrop-blur-sm"
            >
              <option value="newest" className="bg-gray-800 text-white">Newest First</option>
              <option value="oldest" className="bg-gray-800 text-white">Oldest First</option>
              <option value="title" className="bg-gray-800 text-white">Title A-Z</option>
              <option value="published" className="bg-gray-800 text-white">Recently Published</option>
              <option value="views" className="bg-gray-800 text-white">Most Viewed</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedArticles.size > 0 && (
          <div className="mt-4 p-3 bg-[#FCB283]/20 border border-[#FCB283]/30 rounded-lg flex items-center justify-between">
            <span className={`text-sm text-[#FCB283] font-medium ${getClass('body')}`}>
              {selectedArticles.size} articles selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusUpdate('published')}
                className="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
              >
                Publish
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('draft')}
                className="px-3 py-1.5 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
              >
                Draft
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedArticles(new Set())}
                className="px-3 py-1.5 bg-white/20 text-white text-sm rounded hover:bg-white/30 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="glass-container rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-white/70">Total Articles</div>
        </div>
        <div className="glass-container rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{stats.published}</div>
          <div className="text-sm text-white/70">Published</div>
        </div>
        <div className="glass-container rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">{stats.drafts}</div>
          <div className="text-sm text-white/70">Drafts</div>
        </div>
        <div className="glass-container rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{stats.scheduled}</div>
          <div className="text-sm text-white/70">Scheduled</div>
        </div>
        <div className="glass-container rounded-lg p-4">
          <div className="text-2xl font-bold text-[#FCB283]">{stats.totalViews.toLocaleString()}</div>
          <div className="text-sm text-white/70">Total Views</div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="space-y-6">
        {/* Select All */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedArticles.size === filteredArticles.length && filteredArticles.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 text-[#FCB283] border-white/30 bg-white/10 rounded focus:ring-[#FCB283]"
          />
          <span className={`text-sm text-white/80 ${getClass('body')}`}>
            Select All ({filteredArticles.length} articles)
          </span>
        </div>

        {loading ? (
          <div className="glass-container rounded-xl p-12 text-center">
            <div className="text-white/40 mb-4">
              <div className="animate-spin w-8 h-8 border-2 border-[#FCB283] border-t-transparent rounded-full mx-auto"></div>
            </div>
            <p className="text-white/70">Loading articles...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="glass-container rounded-xl p-12 text-center">
            <div className="text-white/40 mb-4">
              <FileText className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No articles found</h3>
            <p className="text-white/70 mb-6">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first article to get started'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && (
              <button 
                onClick={() => onNavigate?.('admin/news/create')}
                className="px-6 py-3 bg-gradient-to-r from-[#AA4626] to-[#FCB283] text-white rounded-lg hover:from-[#AA4626]/90 hover:to-[#FCB283]/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Create First Article
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <div key={article.id} className="glass-container rounded-xl overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-[#FCB283]/50">
                {/* Selection Checkbox */}
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedArticles.has(article.id)}
                    onChange={() => handleSelectArticle(article.id)}
                    className="w-4 h-4 text-[#FCB283] border-white/30 bg-white/10 rounded focus:ring-[#FCB283]"
                  />
                </div>

                {/* Article Cover Image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300">
                  {article.coverImageUrl ? (
                    <img
                      src={article.coverImageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgOTBMMTg1IDEwNUwyMDUgODVMMjI1IDExMEgyNTVWMTMwSDEyNVYxMTBMMTQwIDk1TDE3NSA5MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-700">
                      <FileText className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[article.status]}`}>
                      {statusLabels[article.status]}
                    </span>
                  </div>

                  {/* View Count */}
                  <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-white" />
                    <span className="text-xs text-white">{article.viewCount || 0}</span>
                  </div>
                </div>

                {/* Article Content */}
                <div className="p-4">
                  <h3 className={`text-lg font-semibold text-white mb-2 line-clamp-2 leading-tight ${getClass('header')}`}>
                    {article.title}
                  </h3>
                  
                  <p className={`text-sm text-white/70 mb-3 line-clamp-2 ${getClass('body')}`}>
                    {article.shortDescription}
                  </p>

                  {/* Article Meta */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      <User className="w-3 h-3 text-[#FCB283]" />
                      <span>{article.authorName || 'Unknown Author'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      <Calendar className="w-3 h-3 text-[#FCB283]" />
                      <span>
                        {article.status === 'published' && article.publishedAt 
                          ? `Published ${formatDate(article.publishedAt)}`
                          : `Created ${formatDate(article.createdAt)}`
                        }
                      </span>
                    </div>
                    
                    {article.status === 'scheduled' && article.publishedAt && (
                      <div className="flex items-center gap-2 text-xs text-blue-400">
                        <Clock className="w-3 h-3" />
                        <span>Scheduled for {formatDate(article.publishedAt)} at {formatTime(article.publishedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Categories */}
                  {article.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {article.categories.map((category, index) => (
                        <span
                          key={index}
                          className={`px-2 py-0.5 text-xs rounded-full ${categoryColors[category]} ${getClass('body')}`}
                        >
                          {categoryLabels[category]}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {article.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className={`px-2 py-0.5 text-xs rounded-full border ${getTagColor(tag)} ${getClass('body')}`}
                        >
                          {tag}
                        </span>
                      ))}
                      {article.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-xs rounded-full border border-white/20 text-white/60">
                          +{article.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/20">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewArticle(article.slug)}
                        className="p-1.5 text-white/60 hover:text-[#FCB283] hover:bg-[#FCB283]/20 rounded-lg transition-colors"
                        title="View Public"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => handleEditArticle(article.id)}
                        className="p-1.5 text-white/60 hover:text-green-400 hover:bg-green-400/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => handleDuplicateArticle(article.id)}
                        className="p-1.5 text-white/60 hover:text-purple-400 hover:bg-purple-400/20 rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteArticle(article.id)}
                        className="p-1.5 text-white/60 hover:text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      
                      <button className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination could be added here if needed */}
    </div>
  );
}
