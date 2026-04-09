'use client';

import { useState, useEffect } from 'react';
import { Search, Book, FileText, HelpCircle, ExternalLink, ChevronRight, Bookmark, Clock, Star, ArrowLeft, Loader2 } from 'lucide-react';
import { getBackendApiUrl } from '@/lib/apiConfig';
import { getSupportArticleUrl } from '@/lib/publicSiteUrl';

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch(`${getBackendApiUrl()}/api/articles`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success) {
          setArticles(result.data);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // ... (categories definitions skipped for brevity, they are unchanged) ...
  const categoriesSet = [
    { id: 'all', name: 'All Articles', icon: '📚' },
    { id: 'Understanding ExtraHand', name: 'Understanding ExtraHand', icon: '📖' },
    { id: 'Login/Account Management', name: 'Login/Account Management', icon: '👤' },
    { id: 'Payments & Refunds', name: 'Payments & Refunds', icon: '💳' },
    { id: 'Managing Tasks', name: 'Managing Tasks', icon: '📋' },
    { id: 'Tips for Customers', name: 'Tips for Customers', icon: '💡' },
    { id: 'Trust & Safety', name: 'Trust & Safety', icon: '🛡️' },
  ];

  const categories = categoriesSet.map(cat => ({
    ...cat,
    count: cat.id === 'all'
      ? articles.length
      : articles.filter(a => a.category === cat.id).length
  }));

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const quickLinks = [
    { title: 'Escalation Procedures', icon: '🚨' },
    { title: 'Common Issues FAQ', icon: '❓' },
    { title: 'Contact Support Team', icon: '📞' },
    { title: 'Report a Bug', icon: '🐛' },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with Navigation */}
        <div className="mb-4">
          <button
            onClick={() => window.location.assign('/')}
            className="flex items-center text-amber-600 hover:text-amber-700 mb-2 font-medium transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back to Home</span>
          </button>

          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Book className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span>Knowledge Base</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Search articles, guides, and documentation to help customers</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles, guides, or topics..."
              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Categories */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Categories</h2>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between ${selectedCategory === category.id
                      ? 'bg-amber-50 text-amber-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{category.icon}</span>
                      <span className="text-sm">{category.name}</span>
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{category.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Quick Links</h2>
              <div className="space-y-2">
                {quickLinks.map((link, index) => (
                  <a
                    key={index}
                    href="#"
                    className="flex items-center space-x-2 text-sm text-gray-700 hover:text-amber-600 hover:bg-amber-50 px-3 py-2 rounded-lg transition-all"
                  >
                    <span>{link.icon}</span>
                    <span>{link.title}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Popular Articles Badge */}
            {selectedCategory === 'all' && !searchQuery && articles.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 text-amber-600 mb-4">
                  <Star className="h-5 w-5 fill-amber-600" />
                  <span className="font-semibold">All Articles</span>
                </div>
              </div>
            )}

            {/* Articles Grid */}
            <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Loader2 className="h-10 w-10 animate-spin mb-4 text-amber-500" />
                  <p>Loading articles...</p>
                </div>
              ) : filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <div
                    key={article._id || article.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() =>
                      window.open(getSupportArticleUrl(article._id || article.id), '_blank', 'noopener,noreferrer')
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {article.views > 100 && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                              Popular
                            </span>
                          )}
                          <span className="text-xs text-gray-500">{article.category}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">{article.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(article.updatedAt)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <FileText className="h-3 w-3" />
                            <span>{article.views || 0} views</span>
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-amber-600 transition-colors flex-shrink-0 ml-4" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
                  <p className="text-gray-600">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
