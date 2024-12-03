import React, { useState, useEffect } from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Copy, Star, Clock, FileText, 
  Code, List, Database, Brain, Tag, Bookmark,
  TrendingUp, Award, Users, ChevronDown
} from 'lucide-react';
import PreviewModal from './components/PreviewModal';

const Templates = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('popularity');
  const [bookmarkedTemplates, setBookmarkedTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const categories = [
    { id: 'web', name: 'Web Development', icon: Code },
    { id: 'programming', name: 'Programming', icon: List },
    { id: 'database', name: 'Database', icon: Database },
    { id: 'ai', name: 'AI/ML', icon: Brain },
  ];

  const templates = [
    {
      id: 1,
      title: 'Full Stack Developer Assessment',
      category: 'Web Development',
      duration: '120 mins',
      questions: 40,
      difficulty: 'Advanced',
      popularity: 4.8,
      usageCount: 234,
      tags: ['React', 'Node.js', 'MongoDB', 'REST API'],
      totalMarks: 100,
      description: 'Comprehensive assessment for full-stack developers covering frontend, backend, and database concepts.',
      featured: true,
      lastUpdated: '2024-03-15'
    },
    {
      id: 2,
      title: 'Python Programming Basics',
      category: 'Programming',
      duration: '60 mins',
      questions: 25,
      difficulty: 'Beginner',
      popularity: 4.5,
      usageCount: 567,
      tags: ['Python', 'Programming'],
      totalMarks: 50,
      description: 'Basic assessment for Python programming concepts.',
      featured: false,
      lastUpdated: '2024-03-10'
    },
    {
      id: 3,
      title: 'SQL Database Expert',
      category: 'Database',
      duration: '90 mins',
      questions: 30,
      difficulty: 'Intermediate',
      popularity: 4.6,
      usageCount: 345,
      tags: ['SQL', 'Database'],
      totalMarks: 70,
      description: 'Advanced assessment for SQL database concepts and management.',
      featured: false,
      lastUpdated: '2024-03-05'
    }
  ];

  // Filter and sort templates
  useEffect(() => {
    let filtered = [...templates];

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => 
        template.category.toLowerCase() === selectedCategory
      );
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(template => 
        template.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template => 
        template.title.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.popularity - a.popularity;
        case 'recent':
          return new Date(b.lastUpdated) - new Date(a.lastUpdated);
        case 'usage':
          return b.usageCount - a.usageCount;
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  }, [selectedCategory, selectedDifficulty, searchQuery, sortBy]);

  // Handle template actions
  const handleBookmark = (templateId) => {
    setBookmarkedTemplates(prev => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId);
      }
      return [...prev, templateId];
    });
  };

  const handleCopyTemplate = async (template) => {
    try {
      // Create a copy of the template
      const newTest = {
        ...template,
        id: Date.now(),
        title: `Copy of ${template.title}`,
        lastUpdated: new Date().toISOString()
      };

      // Save to your backend/state management
      // await createTest(newTest);
      
      // Show success message
      alert('Template copied successfully!');
    } catch (error) {
      console.error('Error copying template:', error);
      alert('Failed to copy template');
    }
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
  };

  const handleUseTemplate = (template) => {
    // Navigate to test creation page with template data
    navigate('/vendor/tests/create', { 
      state: { template } 
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Test Templates</h1>
            <p className="text-gray-500 mt-1">Ready-to-use assessment templates for various skills</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates by title, category, or tags..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select 
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="recent">Recently Updated</option>
                    <option value="usage">Most Used</option>
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Quick Filters */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'border hover:bg-gray-50'
              }`}
            >
              <category.icon className="h-4 w-4" />
              {category.name}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className={`hover:shadow-md transition-shadow ${
                template.featured ? 'border-emerald-200 bg-emerald-50/20' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Template Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">{template.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleBookmark(template.id)}
                        className="p-1 hover:bg-gray-50 rounded-full"
                      >
                        <Bookmark 
                          className={`h-4 w-4 ${
                            bookmarkedTemplates.includes(template.id)
                              ? 'text-emerald-500 fill-current'
                              : 'text-gray-400'
                          }`} 
                        />
                      </button>
                      <button 
                        onClick={() => handleCopyTemplate(template)}
                        className="p-1 hover:bg-gray-50 rounded-full"
                      >
                        <Copy className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Template Stats */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{template.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span>{template.questions} Questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-gray-400" />
                      <span>{template.totalMarks} Marks</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Template Footer */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-400 fill-current" />
                        <span className="font-medium">{template.popularity}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Users className="h-4 w-4" />
                        <span>{template.usageCount}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      Updated {new Date(template.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handlePreview(template)}
                      className="flex-1 px-4 py-2 text-emerald-500 border border-emerald-500 rounded-lg hover:bg-emerald-50"
                    >
                      Preview
                    </button>
                    <button 
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {previewTemplate && (
        <PreviewModal 
          template={previewTemplate} 
          onClose={() => setPreviewTemplate(null)} 
        />
      )}
    </Layout>
  );
};

export default Templates; 