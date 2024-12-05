import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Layout from '../../layout/Layout';
import { Card,  CardContent } from '../../common/Card';
import { 
  Search, Filter, Plus, MoreVertical, Clock, Users, Calendar, Download,
  Edit, Trash2, Eye, TrendingUp, Brain, Target, 
  BarChart2, Settings, MessageCircle,  TrendingDown
} from 'lucide-react';
import { testService } from '../../../services/test.service';
import { apiService } from '../../../services/api';

const AllTests = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalTests: { value: 0, trend: 0, subtitle: '' },
    activeCandidates: { value: 0, trend: 0, subtitle: '' },
    passRate: { value: 0, trend: 0, subtitle: '' },
    newDiscussions: { value: 0, trend: 0, subtitle: '' }
  });

  // Initialize quickFilters with default values
  const [quickFilters, setQuickFilters] = useState([
    { label: 'All Tests', count: 0 },
    { label: 'Active', count: 0 },
    { label: 'Draft', count: 0 }
  ]);

  // 1. Add search handler
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // 2. Add category handler
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  // 3. Add filter status handler
  const handleFilterStatusChange = (e) => {
    setFilterStatus(e.target.value);
  };

  // 4. Add quick filters update
  useEffect(() => {
    setQuickFilters([
      { label: 'All Tests', count: tests.length },
      { label: 'Active', count: tests.filter(t => t.status === 'Active').length },
      { label: 'Draft', count: tests.filter(t => t.status === 'Draft').length }
    ]);
  }, [tests]);

  // Update TestCard component to remove unused features
  const TestCard = React.memo(({ test }) => {
    const actions = useTestActions();
    const [showStats, setShowStats] = useState(false);

    // Remove unused metrics
    const status = test?.status || 'Draft';
    const category = test?.category || 'Uncategorized';
    const difficulty = test?.difficulty || 'Beginner';
    const duration = test?.duration || '0 mins';
    const codingQuestionsCount = test?.codingChallenges?.length || 0;
    const mcqCount = test?.mcqs?.length || 0;
    const totalQuestions = codingQuestionsCount + mcqCount;
    const candidates = test?.candidates || 0;
    const lastModified = test?.lastModified || new Date().toISOString();

    // Keep only the formatDate helper function
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    return (
      <Card className="hover:shadow-xl transition-all duration-200 h-full">
        <CardContent className="p-6">
          {/* Keep only essential UI elements */}
          {/* Status Badge and Score */}
          <div className="absolute top-4 right-4 flex flex-col items-end gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              status === 'Active' 
                ? 'bg-green-50 text-green-600' 
                : status === 'Draft'
                ? 'bg-yellow-50 text-yellow-600'
                : 'bg-gray-50 text-gray-600'
            }`}>
              {status}
            </span>
          </div>

          {/* Test Info */}
          <div className="min-h-[60px]">
            <h3 className="font-semibold text-lg text-gray-900 pr-20 line-clamp-2">{test?.title || 'Untitled Test'}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500 truncate">{category}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className={`text-sm font-medium ${
                difficulty === 'Advanced' ? 'text-red-500' :
                difficulty === 'Intermediate' ? 'text-yellow-500' :
                'text-green-500'
              }`}>
                {difficulty}
              </span>
            </div>
          </div>

          {/* Quick Stats Toggle */}
          <button 
            onClick={() => setShowStats(!showStats)}
            className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>

          {/* Test Details */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2 text-gray-400" />
              {duration}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Brain className="h-4 w-4 mr-2 text-gray-400" />
              {totalQuestions} Questions ({codingQuestionsCount} Coding + {mcqCount} MCQ)
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-2 text-gray-400" />
              {candidates} Candidates
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              {formatDate(lastModified)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t flex justify-between items-center">
            <div className="flex gap-2">
              {/* Commented out visibility toggle button */}
              {/*
              <button 
                onClick={() => handleVisibilityToggle(test)}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 group relative" 
                title={`Test is ${test?.visibility || 'private'}`}
              >
                <Eye className={`h-4 w-4 ${
                  test?.visibility === 'public' 
                    ? 'text-green-600' 
                    : 'text-gray-600'
                } group-hover:text-indigo-600`} />
              </button>
              */}
              {/* Commented out edit button */}
              {/*
              <button 
                onClick={() => actions.handleEdit(test.id)}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 group" 
                title="Edit Test"
              >
                <Edit className="h-4 w-4 text-gray-600 group-hover:text-indigo-600" />
              </button>
              */}
              <button 
                onClick={() => handlePublish(test)}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 group" 
                title="Publish & Get Shareable Link"
              >
                <TrendingUp className="h-4 w-4 text-gray-600 group-hover:text-indigo-600" />
              </button>
            </div>
            
            <Popover className="relative">
              <Popover.Button className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                <MoreVertical className="h-4 w-4 text-gray-600" />
              </Popover.Button>

              <Popover.Panel className="absolute right-0 z-10 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <button
                    onClick={() => handleDelete(test.id)}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Test
                  </button>
                  <button
                    onClick={() => handleShare(test.id, [])}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Share Test
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <BarChart2 className="h-4 w-4 mr-2" />
                    View Analytics
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </button>
                </div>
              </Popover.Panel>
            </Popover>
          </div>
        </CardContent>
      </Card>
    );
  });

  // 5. Fix useCallback dependency
  const useTestActions = () => {
    const navigate = useNavigate();
    
    const handleEdit = useCallback((testId) => {
      navigate(`/vendor/tests/${testId}/edit`);
    }, [navigate]);

    const handleDelete = useCallback(async (testId) => {
      if (window.confirm('Are you sure you want to delete this test?')) {
        try {
          toast.success('Test deleted successfully!');
        } catch (error) {
          toast.error('Failed to delete test');
        }
      }
    }, []);

    return {
      handleEdit,
      handleDelete
    };
  };

  // Move fetchTests inside component
  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await testService.getAllTests({
        search: searchTerm,
        category: selectedCategory,
        status: filterStatus
      });
      
      // Debug log to see the structure of the test objects
      console.log('Test objects:', response.data);
      
      setTests(response.data);
    } catch (error) {
      setError(error.message);
      toast.error('Failed to fetch tests');
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add calculateTrend function before useEffect
  const calculateTrend = (trendData) => {
    if (!trendData || trendData.length < 2) return 0;
    
    const current = trendData[trendData.length - 1].count;
    const previous = trendData[trendData.length - 2].count;
    
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Update useEffect to ensure both fetches complete
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch both data in parallel
        const [testsResponse, metricsResponse] = await Promise.all([
          testService.getAllTests({
            search: searchTerm,
            category: selectedCategory,
            status: filterStatus
          }),
          apiService.get('vendor/dashboard/metrics')
        ]);

        // Log responses to debug
        console.log('Tests data:', testsResponse.data);
        console.log('Metrics data:', metricsResponse.data);

        setTests(testsResponse.data);
        
        // Use the metrics directly from the new endpoint
        const metrics = metricsResponse.data;
        setDashboardMetrics({
          totalTests: {
            ...metrics.totalTests,
            trend: calculateTrend(metrics.totalTests.trendData)
          },
          activeCandidates: {
            ...metrics.activeCandidates,
            trend: calculateTrend(metrics.activeCandidates.trendData)
          },
          passRate: metrics.passRate,
          newDiscussions: metrics.newDiscussions
        });

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm, selectedCategory, filterStatus]);

  // Add trend indicator helper function
  const renderTrendIndicator = (trend) => {
    if (trend > 0) {
      return (
        <div className="flex items-center text-green-500">
          <TrendingUp className="h-3 w-3 mr-1" />
          <span>+{trend}%</span>
        </div>
      );
    } else if (trend < 0) {
      return (
        <div className="flex items-center text-red-500">
          <TrendingDown className="h-3 w-3 mr-1" />
          <span>{trend}%</span>
        </div>
      );
    }
    return null;
  };

  // Handle test deletion
  const handleDelete = async (testId) => {
    try {
      await testService.deleteTest(testId);
      toast.success('Test deleted successfully');
      fetchTests(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete test');
    }
  };

  // Handle test publishing
  const handlePublish = async (test) => {
    try {
      const response = await apiService.post(`tests/${test._id}/publish`);
      
      if (response.data) {
        // Update the test in state with published info and shareableLink
        setTests(prevTests => 
          prevTests.map(t => 
            t._id === test._id 
              ? { 
                  ...t, 
                  ...response.data.test,
                  shareableLink: response.data.shareableLink // Store the shareableLink
                }
              : t
          )
        );
        
        // Copy shareable link to clipboard
        navigator.clipboard.writeText(response.data.shareableLink);
        toast.success('Test published! Shareable link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error publishing test:', error);
      if (error.response?.status === 403) {
        toast.error('Not authorized to publish this test');
      } else if (error.response?.status === 400) {
        toast.error('Test validation failed. Please check all required fields.');
      } else {
        toast.error('Failed to publish test');
      }
    }
  };

  // Add this function to handle navigation
  const handleCreateTest = () => {
    navigate('/vendor/tests/create');
  };

  // Add share handler
  const handleShare = async (testId, emails) => {
    try {
      await testService.shareTest(testId, emails);
      toast.success('Test shared successfully');
    } catch (error) {
      toast.error('Failed to share test');
    }
  };

  // Function to sort and get the latest six tests
  const getLatestTests = (tests) => {
    return tests
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
  };

  // Use the sorted and sliced tests in your component
  const latestTests = getLatestTests(tests);

  // Update the loading state handling at the top of the return statement
  if (loading) {
    return (
      <Layout>
        <div className="space-y-8">
          {/* Shimmer loading for metrics */}
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <motion.div
                  className="h-[140px] relative overflow-hidden"
                  animate={{
                    backgroundColor: ['#f3f4f6', '#e5e7eb', '#f3f4f6'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </motion.div>
              </div>
            ))}
          </div>

          {/* Main content loading skeleton */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b">
              <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 border">
                    <div className="space-y-4">
                      <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                      <div className="h-20 bg-gray-100 rounded animate-pulse" />
                      <div className="flex justify-between">
                        <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Add handleVisibilityToggle function
  const handleVisibilityToggle = async (test) => {
    try {
      const newVisibility = test.visibility === 'public' ? 'private' : 'public';
      await testService.updateTestVisibility(test._id, newVisibility);
      
      // Update the test in state
      setTests(prevTests => 
        prevTests.map(t => 
          t._id === test._id 
            ? { ...t, visibility: newVisibility }
            : t
        )
      );
      
      toast.success(`Test is now ${newVisibility}`);
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update test visibility');
    }
  };

  // Add stats array definition before the return statement
  const stats = [
    {
      title: 'Total Tests',
      value: dashboardMetrics.totalTests.value,
      trend: dashboardMetrics.totalTests.trend,
      subtext: dashboardMetrics.totalTests.subtitle,
      color: 'blue',
      icon: Target
    },
    {
      title: 'Active Candidates',
      value: dashboardMetrics.activeCandidates.value,
      trend: dashboardMetrics.activeCandidates.trend,
      subtext: dashboardMetrics.activeCandidates.subtitle,
      color: 'green',
      icon: Users
    },
    {
      title: 'Pass Rate',
      value: `${dashboardMetrics.passRate.value}%`,
      trend: dashboardMetrics.passRate.trend,
      subtext: dashboardMetrics.passRate.subtitle,
      color: 'yellow',
      icon: TrendingUp
    },
    {
      title: 'New Discussions',
      value: dashboardMetrics.newDiscussions.value,
      trend: dashboardMetrics.newDiscussions.trend,
      subtext: dashboardMetrics.newDiscussions.subtitle,
      color: 'purple',
      icon: MessageCircle
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Enhanced Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                    <div className="mt-2 flex items-center gap-2">
                      {renderTrendIndicator(stat.trend)}
                      <span className="text-xs text-gray-500">{stat.subtext}</span>
                    </div>
                  </div>
                  <div className={`p-4 bg-${stat.color}-50 rounded-full`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-500`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Header with Quick Filters */}
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Assessment Tests</h1>
              <p className="text-sm text-gray-500 mt-1">Create, manage and analyze your tests</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </button>
              <button 
                onClick={handleCreateTest}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Test
              </button>
            </div>
          </div>
          
          {/* Quick Filters */}
          <div className="flex gap-4 overflow-x-auto pb-2">
            {quickFilters.map((filter, index) => (
              <button
                key={index}
                className="px-4 py-2 bg-white border rounded-full hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap"
              >
                {filter.label}
                <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Search and Filters */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tests by name, category, skills..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <select 
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                >
                  <option value="all">All Categories</option>
                  <option value="programming">Programming</option>
                  <option value="webdev">Web Development</option>
                  <option value="systemdesign">System Design</option>
                  <option value="devops">DevOps</option>
                </select>
                <select 
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                  value={filterStatus}
                  onChange={handleFilterStatusChange}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                </select>
                <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none">
                  <option>Duration</option>
                  <option>&lt; 30 mins</option>
                  <option>30-60 mins</option>
                  <option>&gt; 60 mins</option>
                </select>
                <button className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50">
                  <Filter className="h-4 w-4" />
                  More Filters
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Toggle */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
          >
            <BarChart2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded ${viewMode === 'table' ? 'bg-gray-100' : ''}`}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Test Cards Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestTests.map((test) => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        )}

        {/* Existing Table View */}
        {viewMode === 'table' && (
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Test Name</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Category</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Duration</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Questions</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Candidates</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Last Modified</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tests.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <div className="text-sm font-medium text-gray-800">{test.title}</div>
                          <div className="text-xs text-gray-500">ID: #{test.id}</div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{test.category}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{test.duration}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{test.questions}</td>
                      <td className="p-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          test.status === 'Active' 
                            ? 'bg-green-50 text-green-600' 
                            : 'bg-gray-50 text-gray-600'
                        }`}>
                          {test.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{test.candidates}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{test.lastModified}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1 hover:bg-gray-100 rounded" title="View">
                            <Eye className="h-4 w-4 text-gray-400" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded" title="Edit">
                            <Edit className="h-4 w-4 text-gray-400" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded" title="Delete">
                            <Trash2 className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AllTests; 